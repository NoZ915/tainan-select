import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import {
  captureAuthStatusRequestSnapshot,
  forceGuestAuthSessionRecord,
} from '../utils/userCacheScope'
import type { AuthStatusRequestSnapshot } from '../utils/userCacheScope'

export type ApiError = Error & {
  status?: number
  data?: unknown
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL,
  withCredentials: true,
})

const requestAuthSessionSnapshots = new WeakMap<object, AuthStatusRequestSnapshot>()

axiosInstance.interceptors.request.use((config) => {
  const requestSnapshot = captureAuthStatusRequestSnapshot()
  requestAuthSessionSnapshots.set(config, requestSnapshot)

  const persistedSessionScope = useAuthStore.getState().user?.cacheScope
  const expectedSessionScope = persistedSessionScope?.startsWith('session:')
    ? persistedSessionScope
    : null
  const method = config.method?.toLowerCase()
  const changesServerState = method !== 'get' && method !== 'head' && method !== 'options'
  if (
    changesServerState
    && expectedSessionScope
    && !config.headers.has('X-Expected-Session-Scope')
  ) {
    config.headers.set(
      'X-Expected-Session-Scope',
      expectedSessionScope,
    )
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => {
    requestAuthSessionSnapshots.delete(response.config)
    return response
  },
  async (error) => {
    const requestConfig = error.config as object | undefined
    const hasRequestSnapshot = requestConfig
      ? requestAuthSessionSnapshots.has(requestConfig)
      : false
    const requestSnapshot = requestConfig
      ? requestAuthSessionSnapshots.get(requestConfig)
      : undefined
    if (requestConfig) requestAuthSessionSnapshots.delete(requestConfig)
    const { logout, isLogoutInProgress, setIsLogoutInProgress } = useAuthStore.getState()

    const currentPath = window.location.pathname
    const isOAuthCallback = currentPath.includes('/auth/google/callback')
    const isMailError = currentPath.includes('/mailError')

    if (
      error.response?.status === 401
      && !isLogoutInProgress
      && !isOAuthCallback
      && !isMailError
      && hasRequestSnapshot
    ) {
      const changedToGuest = await forceGuestAuthSessionRecord(requestSnapshot ?? null)
      if (changedToGuest) {
        setIsLogoutInProgress(true) // 設置標誌，防止再次登出
        logout()
        window.location.href = '/'
      }
    }

    const message = error.response?.data?.message || '發生錯誤，請稍後再試'
    const apiError = new Error(message) as ApiError
    apiError.status = error.response?.status
    apiError.data = error.response?.data
    return Promise.reject(apiError)
  }
)
