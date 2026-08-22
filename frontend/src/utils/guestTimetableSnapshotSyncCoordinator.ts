import type { GuestTimetableSnapshotPayload } from '../apis/guestTimetableSnapshotAPI'
import type { ApiError } from '../apis/axiosInstance'
import { GUEST_TIMETABLE_SNAPSHOT_CONFIG } from '../config/guestTimetableSnapshot'
import type { GuestTimetableStorage } from '../types/timetableType'

type AuthMode = 'unresolved' | 'authenticated' | 'guest'
const GUEST_SNAPSHOT_SEMESTER_PATTERN = /^\d{3}-[12]$/

export type GuestTimetableSnapshotSyncDependencies = {
  getExistingClientId: () => string | null
  getClientId: () => string | Promise<string>
  syncSnapshot: (payload: GuestTimetableSnapshotPayload) => Promise<void>
  deleteSnapshot: (clientId: string) => Promise<void>
  setSyncDisabled: (clientId: string, disabled: boolean) => void
  setTimer: (callback: () => void, delay: number) => number
  clearTimer: (timerId: number) => void
  logError: (message: string, error: unknown) => void
}

export const isRetryableGuestTimetableSnapshotError = (error: unknown): boolean => {
  const status = error instanceof Error ? (error as ApiError).status : undefined
  return status === undefined || status === 429 || status >= 500
}

export const buildGuestSnapshotSemesters = (
  storage: GuestTimetableStorage,
): Record<string, number[]> => Object.fromEntries(
  Object.entries(storage.semesters)
    .filter(([semester]) => GUEST_SNAPSHOT_SEMESTER_PATTERN.test(semester))
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
  private scheduleVersion = 0
  private shouldEnableSync = false
  private deletionTimerId: number | null = null
  private isDeletionPending = false
  private deletionRetryAttempt = 0
  private deletionClientId: string | null = null
  private deletionGeneration = 0
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

    const previousMode = this.authMode
    this.authMode = nextMode
    if (nextMode !== 'guest') {
      this.scheduleVersion += 1
      this.clearPendingSync()
      this.lastPayloadSignature = null
      this.retryAttempt = 0
    }
    if (nextMode === 'guest' && previousMode !== 'guest') {
      this.lastPayloadSignature = null
      this.shouldEnableSync = true
    }
    if (nextMode === 'authenticated') this.shouldEnableSync = false
    if (nextMode === 'guest') {
      this.clearPendingDeletion()
    }
  }

  schedule(storage: GuestTimetableStorage): void {
    if (this.authMode !== 'guest') return

    const semesters = buildGuestSnapshotSemesters(storage)
    if (Object.keys(semesters).length === 0) {
      try {
        if (!this.dependencies.getExistingClientId()) return
      } catch (error) {
        this.dependencies.logError('讀取匿名課表統計識別碼失敗', error)
        return
      }
    }

    const scheduleVersion = ++this.scheduleVersion
    const preparePayload = (clientId: string): void => {
      if (scheduleVersion !== this.scheduleVersion || this.authMode !== 'guest') return

      if (this.shouldEnableSync) {
        try {
          this.dependencies.setSyncDisabled(clientId, false)
        } catch (error) {
          this.dependencies.logError('無法恢復匿名課表統計同步', error)
        }
        this.shouldEnableSync = false
      }

      const payload: GuestTimetableSnapshotPayload = {
        clientId,
        semesters,
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

    try {
      const clientId = this.dependencies.getClientId()
      if (typeof clientId === 'string') {
        preparePayload(clientId)
      } else {
        void clientId.then(preparePayload).catch((error) => {
          this.dependencies.logError('無法準備匿名課表統計同步', error)
        })
      }
    } catch (error) {
      this.dependencies.logError('無法準備匿名課表統計同步', error)
    }
  }

  async deleteSnapshot(): Promise<void> {
    if (this.authMode !== 'authenticated') return

    this.clearPendingSync()
    this.clearPendingDeletion()
    const deletionGeneration = this.deletionGeneration

    let clientId: string
    try {
      clientId = await this.dependencies.getClientId()
    } catch (error) {
      this.dependencies.logError('無法準備移除匿名課表統計 Snapshot', error)
      return
    }
    if (deletionGeneration !== this.deletionGeneration) return
    if (this.authMode !== 'authenticated') return

    try {
      this.dependencies.setSyncDisabled(clientId, true)
    } catch (error) {
      this.dependencies.logError('無法暫停跨分頁匿名課表統計同步', error)
    }
    this.deletionClientId = clientId
    this.isDeletionPending = true

    this.requestChain = this.requestChain.then(() => this.attemptSnapshotDeletion())

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

  private clearPendingDeletion(): void {
    if (this.deletionTimerId !== null) {
      this.dependencies.clearTimer(this.deletionTimerId)
      this.deletionTimerId = null
    }
    this.isDeletionPending = false
    this.deletionRetryAttempt = 0
    this.deletionClientId = null
    this.deletionGeneration += 1
  }

  private async attemptSnapshotDeletion(): Promise<void> {
    if (!this.isDeletionPending || !this.deletionClientId) return

    try {
      await this.dependencies.deleteSnapshot(this.deletionClientId)
      this.lastPayloadSignature = null
      this.retryAttempt = 0
      this.clearPendingDeletion()
    } catch (error) {
      this.dependencies.logError('移除匿名課表統計 Snapshot 失敗', error)
      if (!this.isDeletionPending || !isRetryableGuestTimetableSnapshotError(error)) {
        this.clearPendingDeletion()
        return
      }

      const retryDelay = this.getRetryDelay(this.deletionRetryAttempt)
      this.deletionRetryAttempt += 1
      this.deletionTimerId = this.dependencies.setTimer(() => {
        this.deletionTimerId = null
        this.requestChain = this.requestChain.then(() => this.attemptSnapshotDeletion())
      }, retryDelay)
    }
  }

  private getRetryDelay(retryAttempt: number): number {
    return Math.min(
      GUEST_TIMETABLE_SNAPSHOT_CONFIG.retryInitialDelayMs * (2 ** retryAttempt),
      GUEST_TIMETABLE_SNAPSHOT_CONFIG.retryMaxDelayMs,
    )
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
        if (
          this.lastPayloadSignature !== payloadSignature
          || this.authMode !== 'guest'
          || !isRetryableGuestTimetableSnapshotError(error)
        ) return

        const retryDelay = this.getRetryDelay(this.retryAttempt)
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
