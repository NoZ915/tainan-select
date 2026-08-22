import assert from 'node:assert/strict'
import test from 'node:test'
import type { GuestTimetableSnapshotPayload } from '../../src/apis/guestTimetableSnapshotAPI'
import type { GuestTimetableStorage } from '../../src/types/timetableType'
import {
  buildGuestSnapshotSemesters,
  GuestTimetableSnapshotSyncCoordinator,
  isRetryableGuestTimetableSnapshotError,
} from '../../src/utils/guestTimetableSnapshotSyncCoordinator'

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'

const createStorage = (semesters: Record<string, number[]>): GuestTimetableStorage => ({
  version: 1,
  semesters: Object.fromEntries(Object.entries(semesters).map(([semester, courseIds]) => [
    semester,
    courseIds.map((courseId) => ({
      course: {
        id: courseId,
        name: `課程 ${courseId}`,
        semester,
        department: '測試系所',
        instructor: '測試教師',
      },
      timeslots: [],
      addedAt: '2026-08-22T00:00:00.000Z',
    })),
  ])),
})

const createTestCoordinator = (options?: {
  syncSnapshot?: (payload: GuestTimetableSnapshotPayload) => Promise<void>
  deleteSnapshot?: (clientId: string) => Promise<void>
  logError?: (message: string, error: unknown) => void
}) => {
  let nextTimerId = 1
  let pendingTimer: { id: number; callback: () => void; delay: number } | null = null
  const coordinator = new GuestTimetableSnapshotSyncCoordinator({
    getClientId: () => CLIENT_ID,
    syncSnapshot: options?.syncSnapshot ?? (async () => {}),
    deleteSnapshot: options?.deleteSnapshot ?? (async () => {}),
    setTimer: (callback, delay) => {
      const id = nextTimerId
      nextTimerId += 1
      pendingTimer = { id, callback, delay }
      return id
    },
    clearTimer: (timerId) => {
      if (pendingTimer?.id === timerId) pendingTimer = null
    },
    logError: options?.logError ?? (() => {}),
  })

  return {
    coordinator,
    runPendingTimer: () => {
      const timer = pendingTimer
      pendingTimer = null
      timer?.callback()
    },
    getPendingTimerDelay: () => pendingTimer?.delay ?? null,
  }
}

test('Snapshot payload 只保留排序且去重後的完整 course ID 狀態', () => {
  assert.deepEqual(
    buildGuestSnapshotSemesters(createStorage({
      '115-1': [3, 1, 3],
      '114-2': [8],
      '113-1': [],
    })),
    {
      '114-2': [8],
      '115-1': [1, 3],
    },
  )
})

test('Snapshot payload 對齊後端的學期與課程數量上限', () => {
  const semesters = Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => [
      `${String(104 + index).padStart(3, '0')}-1`,
      Array.from({ length: 105 }, (__, courseIndex) => courseIndex + 1),
    ]),
  )

  const snapshotSemesters = buildGuestSnapshotSemesters(createStorage(semesters))

  assert.deepEqual(Object.keys(snapshotSemesters), [
    '106-1', '107-1', '108-1', '109-1', '110-1',
    '111-1', '112-1', '113-1', '114-1', '115-1',
  ])
  assert.equal(snapshotSemesters['115-1'].length, 100)
})

test('auth resolved 前不同步，登出成 guest 後會補同步現有課表', async () => {
  const payloads: GuestTimetableSnapshotPayload[] = []
  const { coordinator, runPendingTimer } = createTestCoordinator({
    syncSnapshot: async (payload) => {
      payloads.push(payload)
    },
  })
  const storage = createStorage({ '115-1': [1] })

  coordinator.schedule(storage)
  runPendingTimer()
  coordinator.setAuthState(true, true)
  coordinator.schedule(storage)
  runPendingTimer()
  assert.equal(payloads.length, 0)

  coordinator.setAuthState(true, false)
  coordinator.schedule(storage)
  runPendingTimer()
  await coordinator.deleteSnapshot()

  assert.equal(payloads.length, 1)
})

test('auth 暫時變回 unresolved 取消排程後，重新 resolved 仍會補同步', async () => {
  const payloads: GuestTimetableSnapshotPayload[] = []
  const { coordinator, runPendingTimer } = createTestCoordinator({
    syncSnapshot: async (payload) => {
      payloads.push(payload)
    },
  })
  const storage = createStorage({ '115-1': [1] })

  coordinator.setAuthState(true, false)
  coordinator.schedule(storage)
  coordinator.setAuthState(false, false)
  runPendingTimer()

  coordinator.setAuthState(true, false)
  coordinator.schedule(storage)
  runPendingTimer()
  await coordinator.deleteSnapshot()

  assert.deepEqual(payloads.map((payload) => payload.semesters), [
    { '115-1': [1] },
  ])
})

test('debounce 只送出快速連續操作的最新完整狀態', async () => {
  const payloads: GuestTimetableSnapshotPayload[] = []
  const { coordinator, runPendingTimer } = createTestCoordinator({
    syncSnapshot: async (payload) => {
      payloads.push(payload)
    },
  })
  coordinator.setAuthState(true, false)

  coordinator.schedule(createStorage({ '115-1': [1] }))
  coordinator.schedule(createStorage({ '115-1': [1, 2] }))
  runPendingTimer()
  await coordinator.deleteSnapshot()

  assert.deepEqual(payloads.map((payload) => payload.semesters), [
    { '115-1': [1, 2] },
  ])
})

test('相同狀態重複 render 不會產生重複 request', async () => {
  let requestCount = 0
  const { coordinator, runPendingTimer } = createTestCoordinator({
    syncSnapshot: async () => {
      requestCount += 1
    },
  })
  const storage = createStorage({ '115-1': [1] })
  coordinator.setAuthState(true, false)

  coordinator.schedule(storage)
  runPendingTimer()
  await Promise.resolve()
  await Promise.resolve()
  coordinator.schedule(storage)
  runPendingTimer()
  await Promise.resolve()

  assert.equal(requestCount, 1)
})

test('PUT 與登入匯入後的 DELETE 會序列化，避免舊請求最後覆蓋資料', async () => {
  const operations: string[] = []
  let resolveFirstSync = () => {}
  const firstSync = new Promise<void>((resolve) => {
    resolveFirstSync = resolve
  })
  let syncCount = 0
  const { coordinator, runPendingTimer } = createTestCoordinator({
    syncSnapshot: async (payload) => {
      syncCount += 1
      operations.push(`PUT:${Object.values(payload.semesters).flat().join(',')}`)
      if (syncCount === 1) await firstSync
    },
    deleteSnapshot: async () => {
      operations.push('DELETE')
    },
  })
  coordinator.setAuthState(true, false)

  coordinator.schedule(createStorage({ '115-1': [1] }))
  runPendingTimer()
  await Promise.resolve()
  coordinator.schedule(createStorage({ '115-1': [1, 2] }))
  runPendingTimer()
  const deletion = coordinator.deleteSnapshot()

  assert.deepEqual(operations, ['PUT:1'])
  resolveFirstSync()
  await deletion

  assert.deepEqual(operations, ['PUT:1', 'PUT:1,2', 'DELETE'])
})

test('Analytics 失敗只記錄錯誤且不阻止後續 DELETE', async () => {
  const errors: string[] = []
  let deleted = false
  const { coordinator, runPendingTimer } = createTestCoordinator({
    syncSnapshot: async () => {
      throw new Error('network error')
    },
    deleteSnapshot: async () => {
      deleted = true
    },
    logError: (message) => {
      errors.push(message)
    },
  })
  coordinator.setAuthState(true, false)
  coordinator.schedule(createStorage({ '115-1': [1] }))
  runPendingTimer()

  await coordinator.deleteSnapshot()

  assert.equal(deleted, true)
  assert.deepEqual(errors, ['匿名課表統計同步失敗'])
})

test('最新 Snapshot 同步失敗後會以退避方式重試', async () => {
  let attempts = 0
  const { coordinator, runPendingTimer, getPendingTimerDelay } = createTestCoordinator({
    syncSnapshot: async () => {
      attempts += 1
      if (attempts === 1) throw new Error('temporary network error')
    },
  })
  coordinator.setAuthState(true, false)
  coordinator.schedule(createStorage({ '115-1': [1] }))

  runPendingTimer()
  await new Promise<void>((resolve) => setImmediate(resolve))

  assert.equal(attempts, 1)
  assert.equal(getPendingTimerDelay(), 1_000)

  runPendingTimer()
  await coordinator.deleteSnapshot()

  assert.equal(attempts, 2)
})

test('只有網路錯誤、429 與 5xx 會重試', () => {
  assert.equal(isRetryableGuestTimetableSnapshotError(new Error('network error')), true)
  assert.equal(isRetryableGuestTimetableSnapshotError(
    Object.assign(new Error('rate limited'), { status: 429 }),
  ), true)
  assert.equal(isRetryableGuestTimetableSnapshotError(
    Object.assign(new Error('server error'), { status: 500 }),
  ), true)
  assert.equal(isRetryableGuestTimetableSnapshotError(
    Object.assign(new Error('invalid payload'), { status: 400 }),
  ), false)
})

test('Snapshot 刪除暫時失敗後會以退避方式重試', async () => {
  let attempts = 0
  const { coordinator, runPendingTimer, getPendingTimerDelay } = createTestCoordinator({
    deleteSnapshot: async () => {
      attempts += 1
      if (attempts === 1) throw Object.assign(new Error('rate limited'), { status: 429 })
    },
  })
  coordinator.setAuthState(true, true)

  await coordinator.deleteSnapshot()

  assert.equal(attempts, 1)
  assert.equal(getPendingTimerDelay(), 1_000)

  runPendingTimer()
  await new Promise<void>((resolve) => setImmediate(resolve))

  assert.equal(attempts, 2)
  assert.equal(getPendingTimerDelay(), null)
})
