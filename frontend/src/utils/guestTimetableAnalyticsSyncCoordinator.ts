import type { GuestTimetableSnapshotPayload } from '../apis/timetableAnalyticsAPI'
import type { GuestTimetableStorage } from '../types/timetableType'

export const GUEST_TIMETABLE_ANALYTICS_DEBOUNCE_MS = 400

type AuthMode = 'unresolved' | 'authenticated' | 'guest'

export type AnalyticsSyncDependencies = {
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
      [...new Set(items.map((item) => item.course.id))].sort((first, second) => first - second),
    ] as const)
    .filter(([, courseIds]) => courseIds.length > 0)
    .sort(([firstSemester], [secondSemester]) => firstSemester.localeCompare(secondSemester)),
)

export class GuestTimetableAnalyticsSyncCoordinator {
  private readonly dependencies: AnalyticsSyncDependencies
  private authMode: AuthMode = 'unresolved'
  private timerId: number | null = null
  private pendingPayload: GuestTimetableSnapshotPayload | null = null
  private pendingFingerprint: string | null = null
  private lastFingerprint: string | null = null
  private requestChain: Promise<void> = Promise.resolve()

  constructor(dependencies: AnalyticsSyncDependencies) {
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
    }
    if (nextMode === 'authenticated' || wasAuthenticated) {
      this.lastFingerprint = null
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
    const fingerprint = JSON.stringify(payload)
    if (fingerprint === this.lastFingerprint) return

    this.lastFingerprint = fingerprint
    this.pendingPayload = payload
    this.pendingFingerprint = fingerprint
    if (this.timerId !== null) this.dependencies.clearTimer(this.timerId)
    this.timerId = this.dependencies.setTimer(
      () => this.flushPendingSync(),
      GUEST_TIMETABLE_ANALYTICS_DEBOUNCE_MS,
    )
  }

  async deleteAfterSuccessfulImport(): Promise<void> {
    this.clearPendingSync()

    this.requestChain = this.requestChain.then(async () => {
      try {
        await this.dependencies.deleteSnapshot(this.dependencies.getClientId())
        this.lastFingerprint = null
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
    this.pendingFingerprint = null
  }

  private flushPendingSync(): void {
    const payload = this.pendingPayload
    const fingerprint = this.pendingFingerprint
    this.timerId = null
    this.pendingPayload = null
    this.pendingFingerprint = null
    if (!payload || !fingerprint || this.authMode !== 'guest') return

    this.requestChain = this.requestChain.then(async () => {
      try {
        await this.dependencies.syncSnapshot(payload)
      } catch (error) {
        if (this.lastFingerprint === fingerprint) this.lastFingerprint = null
        this.dependencies.logError('匿名課表統計同步失敗', error)
      }
    })
  }
}
