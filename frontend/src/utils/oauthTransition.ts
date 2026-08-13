import { cancelOAuthAttempt, checkAuthStatus } from '../apis/authAPI'
import type { AuthStatusResponse } from '../types/authType'
import { useAuthStore } from '../stores/authStore'
import {
  applyAuthStatusResponse,
  captureAuthStatusRequestSnapshot,
  clearOAuthAuthSessionTransitionOwner,
  getAuthSessionRecord,
  getOAuthAuthSessionTransitionOwner,
  isAuthSessionRecordCurrent,
} from './userCacheScope'

const activeReconciliations = new Map<string, Promise<boolean>>()

const clearOwnedSessionData = (owner: string): void => {
  if (getOAuthAuthSessionTransitionOwner() !== owner) return
  clearOAuthAuthSessionTransitionOwner()
  sessionStorage.removeItem('redirect_path')
}

const hasPublishedOAuthSession = (
  owner: string,
  authStatus: AuthStatusResponse,
): boolean => {
  const record = getAuthSessionRecord()
  if (
    record?.status !== 'transition'
    || record.transitionKind !== 'oauth'
    || record.owner !== owner
  ) {
    return true
  }

  if (!authStatus.authenticated) return false
  if (record.previous.status === 'guest') return true
  return authStatus.session_scope !== record.previous.sessionScope
}

const reconcileOAuthTransitionOnce = async (owner: string): Promise<boolean> => {
  try {
    const attemptStatus = await cancelOAuthAttempt(owner)
    const requestSnapshot = captureAuthStatusRequestSnapshot()
    const authStatus = await checkAuthStatus()

    if (
      attemptStatus === 'completed'
      && !hasPublishedOAuthSession(owner, authStatus)
    ) {
      return false
    }

    const result = await applyAuthStatusResponse(requestSnapshot, authStatus, {
      transitionOwner: owner,
      transitionKind: 'oauth',
    })
    if (!result.applied) {
      const currentRecord = getAuthSessionRecord()
      if (currentRecord?.status === 'transition' && currentRecord.owner === owner) {
        return false
      }
      clearOwnedSessionData(owner)
      return true
    }
    if (!isAuthSessionRecordCurrent(result.record)) return false

    const { login, logout } = useAuthStore.getState()
    if (
      authStatus.authenticated
      && result.record?.status === 'authenticated'
      && result.record.sessionScope === authStatus.session_scope
    ) {
      login(authStatus.user, authStatus.session_scope)
    } else if (!authStatus.authenticated && result.record?.status === 'guest') {
      logout()
    }
    clearOwnedSessionData(owner)
    return true
  } catch {
    return false
  }
}

export const reconcileOAuthTransition = (owner: string): Promise<boolean> => {
  const activeReconciliation = activeReconciliations.get(owner)
  if (activeReconciliation) return activeReconciliation

  const reconciliation = reconcileOAuthTransitionOnce(owner).finally(() => {
    if (activeReconciliations.get(owner) === reconciliation) {
      activeReconciliations.delete(owner)
    }
  })
  activeReconciliations.set(owner, reconciliation)
  return reconciliation
}
