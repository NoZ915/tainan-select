import type { GuestTimetableSnapshotPayload } from '../apis/guestTimetableSnapshotAPI'
import { GUEST_TIMETABLE_SNAPSHOT_CONFIG } from '../config/guestTimetableSnapshot'
import type { GuestTimetableStorage } from '../types/timetableType'

type AuthMode = 'unresolved' | 'authenticated' | 'guest'

export type GuestTimetableSnapshotSyncDependencies = {
  getClientId: () => string
  syncSnapshot: (payload: GuestTimetableSnapshotPayload) => Promise<void>
  deleteSnapshot: (clientId: string) => Promise<void>
  setTimer: (callback: () => void, delay: number) => number
  clearTimer: (timerId: number) => void
  logError: (message: string, error: unknown) => void
}

export const buildGuestSnapshotSemesters = (
  storage: GuestTimetableStorage,
): Record<string, number[]> => Object.fromEntries(
  Object.entries(storage.semesters)
    .map(([semester, items]) => [
      semester,
      [...new Set(items.map((item) => item.course.id))]
        .sort((first, second) => first - second)
        .slice(0, GUEST_TIMETABLE_SNAPSHOT_CONFIG.maxCoursesPerSemester),
    ] as const)
    .filter(([, courseIds]) => courseIds.length > 0)
    .sort(([firstSemester], [secondSemester]) => firstSemester.localeCompare(secondSemester))
    .slice(-GUEST_TIMETABLE_SNAPSHOT_CONFIG.maxSemestersPerSnapshot),
)

export class GuestTimetableSnapshotSyncCoordinator {
  private readonly dependencies: GuestTimetableSnapshotSyncDependencies
  private authMode: AuthMode = 'unresolved'
  private timerId: number | null = null
  private pendingPayload: GuestTimetableSnapshotPayload | null = null
  private pendingPayloadSignature: string | null = null
  private lastPayloadSignature: string | null = null
  private retryAttempt = 0
  private requestChain: Promise<void> = Promise.resolve()

  constructor(dependencies: GuestTimetableSnapshotSyncDependencies) {
    this.dependencies = dependencies
  }

  setAuthState(isAuthResolved: boolean, isAuthenticated: boolean): void {
    const nextMode: AuthMode = !isAuthResolved
      ? 'unresolved'
      : isAuthenticated
        ? 'authenticated'
        : 'guest'

    if (nextMode === this.authMode) return

    const wasAuthenticated = this.authMode === 'authenticated'
    this.authMode = nextMode
    if (nextMode !== 'guest') {
      this.clearPendingSync()
      this.lastPayloadSignature = null
      this.retryAttempt = 0
    }
    if (wasAuthenticated) {
      this.lastPayloadSignature = null
    }
  }

  schedule(storage: GuestTimetableStorage): void {
    if (this.authMode !== 'guest') return

    let clientId: string
    try {
      clientId = this.dependencies.getClientId()
    } catch (error) {
      this.dependencies.logError('無法準備匿名課表統計同步', error)
      return
    }

    const payload: GuestTimetableSnapshotPayload = {
      clientId,
      semesters: buildGuestSnapshotSemesters(storage),
    }
    const payloadSignature = JSON.stringify(payload)
    if (payloadSignature === this.lastPayloadSignature) return

    this.lastPayloadSignature = payloadSignature
    this.retryAttempt = 0
    this.pendingPayload = payload
    this.pendingPayloadSignature = payloadSignature
    if (this.timerId !== null) this.dependencies.clearTimer(this.timerId)
    this.timerId = this.dependencies.setTimer(
      () => this.flushPendingSync(),
      GUEST_TIMETABLE_SNAPSHOT_CONFIG.syncDebounceMs,
    )
  }

  async deleteAfterSuccessfulImport(): Promise<void> {
    this.clearPendingSync()

    this.requestChain = this.requestChain.then(async () => {
      try {
        await this.dependencies.deleteSnapshot(this.dependencies.getClientId())
        this.lastPayloadSignature = null
        this.retryAttempt = 0
      } catch (error) {
        this.dependencies.logError('移除匿名課表統計 Snapshot 失敗', error)
      }
    })

    await this.requestChain
  }

  private clearPendingSync(): void {
    if (this.timerId !== null) {
      this.dependencies.clearTimer(this.timerId)
      this.timerId = null
    }
    this.pendingPayload = null
    this.pendingPayloadSignature = null
  }

  private flushPendingSync(): void {
    const payload = this.pendingPayload
    const payloadSignature = this.pendingPayloadSignature
    this.timerId = null
    this.pendingPayload = null
    this.pendingPayloadSignature = null
    if (!payload || !payloadSignature || this.authMode !== 'guest') return

    this.requestChain = this.requestChain.then(async () => {
      try {
        await this.dependencies.syncSnapshot(payload)
        if (this.lastPayloadSignature === payloadSignature) this.retryAttempt = 0
      } catch (error) {
        this.dependencies.logError('匿名課表統計同步失敗', error)
        if (this.lastPayloadSignature !== payloadSignature || this.authMode !== 'guest') return

        const retryDelay = Math.min(
          GUEST_TIMETABLE_SNAPSHOT_CONFIG.retryInitialDelayMs * (2 ** this.retryAttempt),
          GUEST_TIMETABLE_SNAPSHOT_CONFIG.retryMaxDelayMs,
        )
        this.retryAttempt += 1
        this.pendingPayload = payload
        this.pendingPayloadSignature = payloadSignature
        this.timerId = this.dependencies.setTimer(
          () => this.flushPendingSync(),
          retryDelay,
        )
      }
    })
  }
}
