import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ANALYTICS_CLIENT_ID_STORAGE_KEY,
  createAnalyticsClientId,
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

test('第一次建立的 Analytics client ID 會保存到獨立 localStorage key', async () => {
  const storage = new MemoryStorage()

  const clientId = await getOrCreateAnalyticsClientId(storage, () => CLIENT_ID)

  assert.equal(clientId, CLIENT_ID)
  assert.equal(storage.getItem(ANALYTICS_CLIENT_ID_STORAGE_KEY), CLIENT_ID)
  assert.equal(storage.getItem('tainan-select:guest-timetable:v1'), null)
})

test('後續呼叫會穩定沿用既有 Analytics client ID', async () => {
  const storage = new MemoryStorage()
  storage.setItem(ANALYTICS_CLIENT_ID_STORAGE_KEY, CLIENT_ID.toUpperCase())

  const clientId = await getOrCreateAnalyticsClientId(storage, () => {
    throw new Error('不應重新產生 ID')
  })

  assert.equal(clientId, CLIENT_ID)
})

test('跨分頁 lock 內會重新讀取已由其他分頁建立的 client ID', async () => {
  const storage = new MemoryStorage()
  let createCount = 0

  const clientId = await getOrCreateAnalyticsClientId(
    storage,
    () => {
      createCount += 1
      return '123e4567-e89b-42d3-a456-426614174000'
    },
    async (callback) => {
      storage.setItem(ANALYTICS_CLIENT_ID_STORAGE_KEY, CLIENT_ID)
      return callback()
    },
  )

  assert.equal(clientId, CLIENT_ID)
  assert.equal(createCount, 0)
})

test('randomUUID 不存在時仍會由 random bytes 建立 UUID v4', () => {
  const clientId = createAnalyticsClientId({
    getRandomValues: (values) => {
      values.fill(0)
    },
  })

  assert.equal(clientId, '00000000-0000-4000-8000-000000000000')
})
