import { Outlet, ScrollRestoration } from 'react-router-dom'
import { useEffect } from 'react'
import { Alert, Button, Group, Text } from '@mantine/core'

import { useAuthStore } from './stores/authStore'
import { useCheckAuthStatus } from './hooks/auth/useCheckAuthStatus'

import RouteHeadTitle from './seo/RouteHeadTitle'

import Header from './components/Header'
import Footer from './components/Footer'
import {
  applyAuthStatusResponse,
  getAuthSessionRecord,
  isAuthSessionRecordCurrent,
  recoverExpiredAuthSessionTransition,
  subscribeAuthSessionRecord,
} from './utils/userCacheScope'

function App() {
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
      const recoveredTransition = await recoverExpiredAuthSessionTransition()
      if (recoveredTransition) {
        void refetch()
      }
      const sharedRecord = getAuthSessionRecord()
      if (sharedRecord?.status === 'guest') {
        logout()
        return
      }
      if (sharedRecord?.status === 'authenticated') {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollRestoration />
      <RouteHeadTitle />
      <Header />
      {hasCurrentAuthError && (
        <Alert color='red' title='無法確認登入狀態' radius={0}>
          <Group justify='space-between' align='center' gap='sm'>
            <Text size='sm'>已登入狀態不會因連線異常切換成訪客。</Text>
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
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default App
