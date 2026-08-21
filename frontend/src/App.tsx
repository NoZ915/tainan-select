import { Outlet, ScrollRestoration } from 'react-router-dom'
import { useEffect } from 'react'
import { Alert, Button, Group, Text } from '@mantine/core'

import { useAuthStore } from './stores/authStore'
import { useCheckAuthStatus } from './hooks/auth/useCheckAuthStatus'
import { useSyncGuestTimetableAnalytics } from './hooks/timetables/useSyncGuestTimetableAnalytics'

import RouteHeadTitle from './seo/RouteHeadTitle'

import Header from './components/Header'
import Footer from './components/Footer'
import GuestTimetableImportModal from './components/GuestTimetableImportModal'
import {
  applyAuthStatusResponse,
  clearOAuthAuthSessionTransitionOwner,
  getAuthSessionRecord,
  getOAuthAuthSessionTransitionOwner,
  isAuthSessionRecordCurrent,
  recoverExpiredAuthSessionTransition,
  subscribeAuthSessionRecord,
} from './utils/userCacheScope'
import { reconcileOAuthTransition } from './utils/oauthTransition'

const OAUTH_RETURN_GRACE_MS = 2_000
const OAUTH_TRANSITION_TIMEOUT_MS = 10 * 60 * 1000

function App() {
  useSyncGuestTimetableAnalytics()
  const { login, logout, markAuthUnresolved, isLogoutInProgress } = useAuthStore()
  const {
    data,
    isError,
    isFetching,
    errorUpdatedAt,
    dataUpdatedAt,
    refetch,
  } = useCheckAuthStatus()
  const hasCurrentAuthError = isError && errorUpdatedAt >= dataUpdatedAt

  useEffect(() => {
    if (isLogoutInProgress) return

    if (hasCurrentAuthError) {
      markAuthUnresolved()
      return
    }

    if (!data) return

    let disposed = false
    void applyAuthStatusResponse(data.requestSnapshot, data.authStatus).then((result) => {
      if (disposed || !result.applied || !isAuthSessionRecordCurrent(result.record)) return

      if (
        data.authStatus.authenticated
        && result.record?.status === 'authenticated'
        && result.record.sessionScope === data.authStatus.session_scope
      ) {
        login(data.authStatus.user, data.authStatus.session_scope)
      } else if (!data.authStatus.authenticated && result.record?.status === 'guest') {
        logout()
      }
    })

    return () => {
      disposed = true
    }
  }, [data, hasCurrentAuthError, isLogoutInProgress, login, logout, markAuthUnresolved])

  useEffect(() => {
    const synchronizeSharedSession = async (): Promise<void> => {
      const initialRecord = getAuthSessionRecord()
      const transitionAge = initialRecord?.status === 'transition'
        ? Date.now() - initialRecord.startedAt
        : 0
      if (
        initialRecord?.status === 'transition'
        && initialRecord.transitionKind === 'oauth'
        && (
          transitionAge >= OAUTH_TRANSITION_TIMEOUT_MS
          || (
            transitionAge >= OAUTH_RETURN_GRACE_MS
            && getOAuthAuthSessionTransitionOwner() === initialRecord.owner
            && !window.location.pathname.includes('/auth/google/callback')
          )
        )
      ) {
        await reconcileOAuthTransition(initialRecord.owner)
      }
      const recoveredTransition = await recoverExpiredAuthSessionTransition()
      if (recoveredTransition) {
        clearOAuthAuthSessionTransitionOwner()
        void refetch()
      }
      const sharedRecord = getAuthSessionRecord()
      if (sharedRecord?.status === 'guest') {
        clearOAuthAuthSessionTransitionOwner()
        logout()
        return
      }
      if (sharedRecord?.status === 'authenticated') {
        clearOAuthAuthSessionTransitionOwner()
        const currentUserCacheScope = useAuthStore.getState().user?.cacheScope
        if (currentUserCacheScope !== `session:${sharedRecord.sessionScope}`) {
          void refetch()
        }
      }
    }

    const unsubscribe = subscribeAuthSessionRecord(() => {
      void synchronizeSharedSession()
    })
    const recoveryTimer = window.setInterval(
      () => void synchronizeSharedSession(),
      30_000,
    )
    void synchronizeSharedSession()

    return () => {
      unsubscribe()
      window.clearInterval(recoveryTimer)
    }
  }, [logout, refetch])

  useEffect(() => {
    const cancelReturnedOAuthTransition = (): void => {
      if (window.location.pathname.includes('/auth/google/callback')) return
      const owner = getOAuthAuthSessionTransitionOwner()
      if (!owner) return

      void reconcileOAuthTransition(owner).then((settled) => {
        if (settled) void refetch()
      })
    }

    const handlePageShow = (event: PageTransitionEvent): void => {
      if (event.persisted) cancelReturnedOAuthTransition()
    }
    window.addEventListener('pageshow', handlePageShow)

    cancelReturnedOAuthTransition()

    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [refetch])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollRestoration />
      <RouteHeadTitle />
      <Header />
      {hasCurrentAuthError && (
        <Alert color='red' title='無法確認登入狀態' radius={0}>
          <Group justify='space-between' align='center' gap='sm'>
            <Text size='sm'>已登入狀態不會因連線異常切換成訪客；訪客仍可查看裝置上的課表。</Text>
            <Button
              variant='light'
              color='red'
              size='xs'
              loading={isFetching}
              onClick={() => void refetch()}
            >
              重新確認
            </Button>
          </Group>
        </Alert>
      )}
      <GuestTimetableImportModal />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default App
