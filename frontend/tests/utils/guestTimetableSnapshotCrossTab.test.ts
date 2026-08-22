import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isGuestTimetableSnapshotSyncDisabled,
  setGuestTimetableSnapshotSyncDisabled,
  withGuestTimetableSnapshotLock,
} from '../../src/utils/guestTimetableSnapshotCrossTab'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length(): number {
    return this.values.size
  }

  clear(): void {
    this.values.clear()
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }
}

const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'

test('跨分頁 request 使用同一個 client lock', async () => {
  const requestedLocks: string[] = []
  const result = await withGuestTimetableSnapshotLock(
    CLIENT_ID,
    () => 'completed',
    {
      request: async (name, callback) => {
        requestedLocks.push(name)
        return callback()
      },
    },
  )

  assert.equal(result, 'completed')
  assert.deepEqual(requestedLocks, [
    `tainan-select:guest-timetable-snapshot:${CLIENT_ID}`,
  ])
})

test('DELETE 標記會阻止同 client 的 PUT，回到 guest 後可解除', () => {
  const storage = new MemoryStorage()
  const payload = { clientId: CLIENT_ID, semesters: { '115-1': [1] } }

  setGuestTimetableSnapshotSyncDisabled(CLIENT_ID, true, storage)
  assert.equal(isGuestTimetableSnapshotSyncDisabled(payload, storage), true)

  setGuestTimetableSnapshotSyncDisabled(CLIENT_ID, false, storage)
  assert.equal(isGuestTimetableSnapshotSyncDisabled(payload, storage), false)
})
