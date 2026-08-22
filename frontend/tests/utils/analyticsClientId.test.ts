import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANALYTICS_CLIENT_ID_STORAGE_KEY,
  getOrCreateAnalyticsClientId,
} from '../../src/utils/analyticsClientId'

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

test('第一次建立的 Analytics client ID 會保存到獨立 localStorage key', () => {
  const storage = new MemoryStorage()

  const clientId = getOrCreateAnalyticsClientId(storage, () => CLIENT_ID)

  assert.equal(clientId, CLIENT_ID)
  assert.equal(storage.getItem(ANALYTICS_CLIENT_ID_STORAGE_KEY), CLIENT_ID)
  assert.equal(storage.getItem('tainan-select:guest-timetable:v1'), null)
})

test('後續呼叫會穩定沿用既有 Analytics client ID', () => {
  const storage = new MemoryStorage()
  storage.setItem(ANALYTICS_CLIENT_ID_STORAGE_KEY, CLIENT_ID.toUpperCase())

  const clientId = getOrCreateAnalyticsClientId(storage, () => {
    throw new Error('不應重新產生 ID')
  })

  assert.equal(clientId, CLIENT_ID)
})
