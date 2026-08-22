export const ANALYTICS_CLIENT_ID_STORAGE_KEY = 'tainan-select:analytics-client-id:v1'

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isAnalyticsClientId = (value: unknown): value is string => (
  typeof value === 'string' && UUID_V4_PATTERN.test(value)
)

export const getAnalyticsClientId = (
  storage: Storage = window.localStorage,
): string | null => {
  const clientId = storage.getItem(ANALYTICS_CLIENT_ID_STORAGE_KEY)
  return isAnalyticsClientId(clientId) ? clientId.toLowerCase() : null
}

type AnalyticsClientIdRandomSource = {
  randomUUID?: () => string
  getRandomValues?: (values: Uint8Array) => void
}

export const createAnalyticsClientId = (
  randomSource: AnalyticsClientIdRandomSource = typeof crypto === 'undefined'
    ? {}
    : {
        randomUUID: typeof crypto.randomUUID === 'function'
          ? () => crypto.randomUUID()
          : undefined,
        getRandomValues: typeof crypto.getRandomValues === 'function'
          ? (values) => { crypto.getRandomValues(values) }
          : undefined,
      },
): string => {
  if (randomSource.randomUUID) return randomSource.randomUUID()

  const bytes = new Uint8Array(16)
  if (randomSource.getRandomValues) {
    randomSource.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hexadecimal = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
  return [
    hexadecimal.slice(0, 8),
    hexadecimal.slice(8, 12),
    hexadecimal.slice(12, 16),
    hexadecimal.slice(16, 20),
    hexadecimal.slice(20),
  ].join('-')
}

export const getOrCreateAnalyticsClientId = (
  storage: Storage = window.localStorage,
  createId: () => string = createAnalyticsClientId,
  withLock: <Result>(callback: () => Result) => Promise<Result> = (callback) => (
    typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('tainan-select:analytics-client-id', callback)
      : Promise.resolve(callback())
  ),
): Promise<string> => withLock(() => {
  const currentClientId = getAnalyticsClientId(storage)
  if (currentClientId) return currentClientId

  const clientId = createId().toLowerCase()
  if (!isAnalyticsClientId(clientId)) {
    throw new Error('無法建立匿名課表統計識別碼')
  }

  storage.setItem(ANALYTICS_CLIENT_ID_STORAGE_KEY, clientId)
  return clientId
})
