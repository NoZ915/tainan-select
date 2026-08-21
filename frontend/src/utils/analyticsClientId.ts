export const ANALYTICS_CLIENT_ID_STORAGE_KEY = 'tainan-select:analytics-client-id:v1'

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isAnalyticsClientId = (value: unknown): value is string => (
  typeof value === 'string' && UUID_V4_PATTERN.test(value)
)

export const getOrCreateAnalyticsClientId = (
  storage: Storage = window.localStorage,
  createId: () => string = () => crypto.randomUUID(),
): string => {
  const storedClientId = storage.getItem(ANALYTICS_CLIENT_ID_STORAGE_KEY)
  if (isAnalyticsClientId(storedClientId)) return storedClientId.toLowerCase()

  const clientId = createId().toLowerCase()
  if (!isAnalyticsClientId(clientId)) {
    throw new Error('無法建立匿名課表統計識別碼')
  }

  storage.setItem(ANALYTICS_CLIENT_ID_STORAGE_KEY, clientId)
  return clientId
}
