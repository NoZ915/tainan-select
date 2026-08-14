import type { AuthStatusResponse } from '../types/authType'
import type { User } from '../types/userType'

export const GUEST_USER_CACHE_SCOPE = 'guest'
export const UNKNOWN_AUTHENTICATED_USER_CACHE_SCOPE = 'user:unknown'

const AUTH_SESSION_RECORD_STORAGE_KEY = 'tainan-select:auth-session-epoch:v1'
const OAUTH_TRANSITION_OWNER_SESSION_KEY = 'tainan-select:oauth-transition-owner:v1'
const AUTH_SESSION_RECORD_CHANGE_EVENT = 'tainan-select:auth-session-record:change'
const AUTH_SESSION_RECORD_LOCK = 'tainan-select:auth-session-record:lock'
const AUTH_TRANSITION_TIMEOUT_MS = 10 * 60 * 1000

type CacheScopedUser = User & {
  cacheScope?: string
}

type CacheScopedAuthState = {
  isAuthenticated: boolean
  isAuthResolved: boolean
  user: CacheScopedUser | null | undefined
}

type StableAuthSessionSnapshot =
  | { status: 'authenticated'; sessionScope: string }
  | { status: 'guest'; sessionScope: null }

type StableAuthSessionRecord = StableAuthSessionSnapshot & {
  epoch: string
}

export type TransitionAuthSessionRecord = {
  status: 'transition'
  sessionScope: null
  transitionKind: 'oauth' | 'logout'
  owner: string
  startedAt: number
  previous: StableAuthSessionSnapshot
  epoch: string
}

export type AuthSessionRecord = StableAuthSessionRecord | TransitionAuthSessionRecord

export type AuthStatusRequestSnapshot = AuthSessionRecord | null

type ApplyAuthStatusOptions = {
  transitionOwner?: string | null
  transitionKind?: 'oauth' | 'logout'
}

type ApplyAuthStatusResult = {
  applied: boolean
  record: AuthSessionRecord | null
}

let authSessionRecordQueue = Promise.resolve()

export const createAuthenticatedUserCacheScope = (sessionScope: string): string =>
  `session:${sessionScope}`

export const getUserCacheScope = (user: CacheScopedUser | null | undefined): string => {
  if (!user) return GUEST_USER_CACHE_SCOPE

  return user.cacheScope ?? UNKNOWN_AUTHENTICATED_USER_CACHE_SCOPE
}

const createOpaqueId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const createStableRecord = (
  snapshot: StableAuthSessionSnapshot,
): AuthSessionRecord => ({
  ...snapshot,
  epoch: createOpaqueId(),
})

const isStableSnapshot = (value: unknown): value is StableAuthSessionSnapshot => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StableAuthSessionSnapshot>
  return candidate.status === 'guest'
    ? candidate.sessionScope === null
    : candidate.status === 'authenticated'
      && typeof candidate.sessionScope === 'string'
      && candidate.sessionScope.length > 0
}

const isAuthSessionRecord = (value: unknown): value is AuthSessionRecord => {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AuthSessionRecord>
  if (typeof candidate.epoch !== 'string' || candidate.epoch.length === 0) return false
  if (isStableSnapshot(candidate)) return true
  if (candidate.status !== 'transition') return false

  return candidate.sessionScope === null
    && (candidate.transitionKind === 'oauth' || candidate.transitionKind === 'logout')
    && typeof candidate.owner === 'string'
    && candidate.owner.length > 0
    && typeof candidate.startedAt === 'number'
    && Number.isFinite(candidate.startedAt)
    && isStableSnapshot(candidate.previous)
}

const dispatchAuthSessionRecordChange = (): void => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(AUTH_SESSION_RECORD_CHANGE_EVENT))
}

const readAuthSessionRecordRawValue = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(AUTH_SESSION_RECORD_STORAGE_KEY)
  } catch {
    return null
  }
}

// 讀取時保留 raw 字串，寫入前重新比對；Web Locks 不可用時，
// 同分頁佇列無法阻擋其他分頁的並行 transition，這是最後一道防線。
const getAuthSessionRecordWithRaw = (): {
  raw: string | null
  record: AuthSessionRecord | null
} => {
  const raw = readAuthSessionRecordRawValue()
  if (!raw) return { raw, record: null }

  try {
    const parsedRecord: unknown = JSON.parse(raw)
    return { raw, record: isAuthSessionRecord(parsedRecord) ? parsedRecord : null }
  } catch {
    return { raw, record: null }
  }
}

export const getAuthSessionRecord = (): AuthSessionRecord | null =>
  getAuthSessionRecordWithRaw().record

// 回傳是否成功寫入；raw 值與寫入前不符（其他分頁已變更）時放棄寫入，
// 由呼叫端依既有的「操作未套用」路徑處理，而非讓寫入互相覆蓋。
const writeAuthSessionRecord = (
  record: AuthSessionRecord,
  expectedRawValue: string | null,
): boolean => {
  if (typeof window === 'undefined') return false
  if (readAuthSessionRecordRawValue() !== expectedRawValue) return false

  window.localStorage.setItem(AUTH_SESSION_RECORD_STORAGE_KEY, JSON.stringify(record))
  dispatchAuthSessionRecordChange()
  return true
}

const recordsMatch = (
  first: AuthStatusRequestSnapshot,
  second: AuthStatusRequestSnapshot,
): boolean => first === null || second === null
  ? first === second
  : first.epoch === second.epoch
    && first.status === second.status
    && first.sessionScope === second.sessionScope

const withAuthSessionRecordLock = async <Result>(
  operation: () => Result | Promise<Result>,
): Promise<Result> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(AUTH_SESSION_RECORD_LOCK, operation)
  }

  const queuedOperation = authSessionRecordQueue.then(operation, operation)
  authSessionRecordQueue = queuedOperation.then(() => undefined, () => undefined)
  return queuedOperation
}

const getStableSnapshot = (
  record: AuthSessionRecord | null,
): StableAuthSessionSnapshot => {
  if (!record) return { status: 'guest', sessionScope: null }
  if (record.status === 'transition') return record.previous
  return record
}

export const beginAuthSessionTransition = async (
  transitionKind: 'oauth' | 'logout',
): Promise<TransitionAuthSessionRecord | null> => withAuthSessionRecordLock(() => {
  const { raw, record: currentRecord } = getAuthSessionRecordWithRaw()
  if (currentRecord?.status === 'transition') return null

  const owner = createOpaqueId()
  const nextRecord: TransitionAuthSessionRecord = {
    status: 'transition',
    sessionScope: null,
    transitionKind,
    owner,
    startedAt: Date.now(),
    previous: getStableSnapshot(currentRecord),
    epoch: createOpaqueId(),
  }
  if (!writeAuthSessionRecord(nextRecord, raw)) return null
  return nextRecord
})

export const beginOAuthAuthSessionTransition = async (): Promise<string | null> => {
  const transition = await beginAuthSessionTransition('oauth')
  if (!transition) return null
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(OAUTH_TRANSITION_OWNER_SESSION_KEY, transition.owner)
  }
  return transition.owner
}

export const getOAuthAuthSessionTransitionOwner = (): string | null => {
  if (typeof window === 'undefined') return null

  try {
    return window.sessionStorage.getItem(OAUTH_TRANSITION_OWNER_SESSION_KEY)
  } catch {
    return null
  }
}

export const clearOAuthAuthSessionTransitionOwner = (): void => {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(OAUTH_TRANSITION_OWNER_SESSION_KEY)
  } catch {
    return
  }
}

const restoreTransitionPreviousState = (
  transition: TransitionAuthSessionRecord,
): AuthSessionRecord => createStableRecord(transition.previous)

export const cancelAuthSessionTransition = async (owner: string): Promise<boolean> => (
  withAuthSessionRecordLock(() => {
    const { raw, record: currentRecord } = getAuthSessionRecordWithRaw()
    if (currentRecord?.status !== 'transition' || currentRecord.owner !== owner) {
      return false
    }

    return writeAuthSessionRecord(restoreTransitionPreviousState(currentRecord), raw)
  })
)

export const recoverExpiredAuthSessionTransition = async (): Promise<boolean> => (
  withAuthSessionRecordLock(() => {
    const { raw, record: currentRecord } = getAuthSessionRecordWithRaw()
    if (
      currentRecord?.status !== 'transition'
      || currentRecord.transitionKind === 'oauth'
      || Date.now() - currentRecord.startedAt < AUTH_TRANSITION_TIMEOUT_MS
    ) {
      return false
    }

    return writeAuthSessionRecord(restoreTransitionPreviousState(currentRecord), raw)
  })
)

export const subscribeAuthSessionRecord = (
  listener: () => void,
): (() => void) => {
  if (typeof window === 'undefined') return () => undefined

  const handleStorage = (event: StorageEvent): void => {
    if (event.key === AUTH_SESSION_RECORD_STORAGE_KEY) listener()
  }
  window.addEventListener('storage', handleStorage)
  window.addEventListener(AUTH_SESSION_RECORD_CHANGE_EVENT, listener)

  return () => {
    window.removeEventListener('storage', handleStorage)
    window.removeEventListener(AUTH_SESSION_RECORD_CHANGE_EVENT, listener)
  }
}

export const captureAuthStatusRequestSnapshot = (): AuthStatusRequestSnapshot =>
  getAuthSessionRecord()

export const isAuthSessionRecordCurrent = (
  expectedRecord: AuthStatusRequestSnapshot,
): boolean => recordsMatch(expectedRecord, getAuthSessionRecord())

export const applyAuthStatusResponse = async (
  requestSnapshot: AuthStatusRequestSnapshot,
  authStatus: AuthStatusResponse,
  options: ApplyAuthStatusOptions = {},
): Promise<ApplyAuthStatusResult> => withAuthSessionRecordLock(() => {
  const { raw, record: currentRecord } = getAuthSessionRecordWithRaw()
  if (!recordsMatch(requestSnapshot, currentRecord)) {
    return { applied: false, record: currentRecord }
  }

  const requiresOwnedTransition = options.transitionOwner !== undefined
    || options.transitionKind !== undefined
  if (requiresOwnedTransition && currentRecord?.status !== 'transition') {
    return { applied: false, record: currentRecord }
  }

  if (currentRecord?.status === 'transition') {
    const ownsTransition = options.transitionKind === currentRecord.transitionKind
      && options.transitionOwner === currentRecord.owner
    if (!ownsTransition) return { applied: false, record: currentRecord }
  }

  let nextRecord: AuthSessionRecord
  if (authStatus.authenticated) {
    if (
      currentRecord?.status === 'authenticated'
      && currentRecord.sessionScope === authStatus.session_scope
    ) {
      nextRecord = currentRecord
    } else {
      nextRecord = createStableRecord({
        status: 'authenticated',
        sessionScope: authStatus.session_scope,
      })
    }
  } else if (currentRecord?.status === 'guest') {
    nextRecord = currentRecord
  } else if (currentRecord?.status === 'transition') {
    nextRecord = restoreTransitionPreviousState(currentRecord)
  } else {
    nextRecord = createStableRecord({ status: 'guest', sessionScope: null })
  }

  if (nextRecord !== currentRecord && !writeAuthSessionRecord(nextRecord, raw)) {
    return { applied: false, record: currentRecord }
  }
  return { applied: true, record: nextRecord }
})

export const completeLogoutAuthSessionTransition = async (
  owner: string,
): Promise<boolean> => withAuthSessionRecordLock(() => {
  const { raw, record: currentRecord } = getAuthSessionRecordWithRaw()
  if (
    currentRecord?.status !== 'transition'
    || currentRecord.transitionKind !== 'logout'
    || currentRecord.owner !== owner
  ) {
    return false
  }

  return writeAuthSessionRecord(createStableRecord({ status: 'guest', sessionScope: null }), raw)
})

export const forceGuestAuthSessionRecord = async (
  requestSnapshot: AuthStatusRequestSnapshot,
): Promise<boolean> => (
  withAuthSessionRecordLock(() => {
    const { raw, record: currentRecord } = getAuthSessionRecordWithRaw()
    if (!recordsMatch(requestSnapshot, currentRecord)) return false
    if (currentRecord?.status === 'transition') return false
    if (currentRecord?.status === 'guest') return true
    return writeAuthSessionRecord(createStableRecord({ status: 'guest', sessionScope: null }), raw)
  })
)

export const captureAuthSessionEpoch = (): string =>
  getAuthSessionRecord()?.epoch ?? ''

export const isAuthenticatedUserCacheScopeCurrent = (
  authState: CacheScopedAuthState,
  expectedUserCacheScope: string,
  expectedAuthSessionEpoch: string,
): boolean => {
  const currentRecord = getAuthSessionRecord()
  return authState.isAuthResolved
    && authState.isAuthenticated
    && currentRecord?.status === 'authenticated'
    && currentRecord.epoch === expectedAuthSessionEpoch
    && createAuthenticatedUserCacheScope(currentRecord.sessionScope) === expectedUserCacheScope
    && getUserCacheScope(authState.user) === expectedUserCacheScope
}
