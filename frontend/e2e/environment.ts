import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'

config({ path: fileURLToPath(new URL('../.env.e2e.local', import.meta.url)) })

const frontendUrl = new URL(process.env.E2E_BASE_URL || 'https://staging.nutnselect.com')
const backendUrl = new URL(process.env.E2E_API_BASE_URL || 'https://api-staging.nutnselect.com/api')
const localHosts = ['localhost', '127.0.0.1', '[::1]']

for (const [url, stagingHost] of [[frontendUrl, 'staging.nutnselect.com'], [backendUrl, 'api-staging.nutnselect.com']] as const) {
  if (!localHosts.includes(url.hostname) && (url.hostname !== stagingHost || url.protocol !== 'https:')) {
    throw new Error('E2E 僅能對隔離測試子網域或本機執行，請檢查 E2E 網址設定')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('E2E 網址不得包含帳密、查詢參數或錨點')
  }
}
if (frontendUrl.pathname !== '/' || backendUrl.pathname.replace(/\/$/, '') !== '/api') {
  throw new Error('E2E 前端網址須為 origin，API 網址須包含 /api')
}

export const frontendBaseUrl = frontendUrl.origin
export const apiOrigin = backendUrl.origin
export const apiBaseUrl = `${apiOrigin}/api`
export const gatewayUsername = process.env.E2E_GATEWAY_USERNAME
export const gatewayPassword = process.env.E2E_GATEWAY_PASSWORD

if (Boolean(gatewayUsername) !== Boolean(gatewayPassword)) {
  throw new Error('E2E 入口帳號與密碼必須一起設定')
}
if (!localHosts.includes(backendUrl.hostname) && (!gatewayUsername || !gatewayPassword)) {
  throw new Error('請在 .env.e2e.local 設定 E2E_GATEWAY_USERNAME 與 E2E_GATEWAY_PASSWORD')
}
