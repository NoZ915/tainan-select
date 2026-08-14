import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useGetAuthStatus } from '../hooks/auth/useGetAuthStatus'
import { useLocation, useNavigate } from 'react-router-dom'
import { Container, Loader } from '@mantine/core'
import {
  clearOAuthAuthSessionTransitionOwner,
  getOAuthAuthSessionTransitionOwner,
} from '../utils/userCacheScope'
import { QUERY_KEYS } from '../hooks/queryKeys'
import { reconcileOAuthTransition } from '../utils/oauthTransition'

const OAuthCallbackPage: React.FC = () => {
  const oauthTransitionOwner = useRef(getOAuthAuthSessionTransitionOwner()).current
  const location = useLocation()
  const oauthError = new URLSearchParams(location.search).get('error')
  const { data: user, isFetching, isError } = useGetAuthStatus(
    oauthError ? null : oauthTransitionOwner,
  )
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hasRedirected = useRef(false)

  useEffect(() => () => {
    if (!oauthTransitionOwner || hasRedirected.current) return

    sessionStorage.removeItem('redirect_path')
    void reconcileOAuthTransition(oauthTransitionOwner).then(() => {
      void queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS],
        type: 'active',
      })
    })
  }, [oauthTransitionOwner, queryClient])

  useEffect(() => {
    if (hasRedirected.current) return

    const cancelAndRevalidate = (redirectPath: string): void => {
      if (!oauthTransitionOwner) return
      hasRedirected.current = true
      void reconcileOAuthTransition(oauthTransitionOwner).then(() => {
        void queryClient.refetchQueries({
          queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS],
          type: 'active',
        })
      })
      sessionStorage.removeItem('redirect_path')
      navigate(redirectPath, { replace: true })
    }

    if (!oauthTransitionOwner) {
      hasRedirected.current = true
      sessionStorage.removeItem('redirect_path')
      void queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS],
        type: 'active',
      })
      navigate('/', { replace: true })
      return
    }

    if (oauthError === 'invalid_email') {
      cancelAndRevalidate('/mailError')
      return
    }

    if (oauthError) {
      cancelAndRevalidate('/')
      return
    }
  
    if (user) {
      hasRedirected.current = true
      clearOAuthAuthSessionTransitionOwner()
      const redirect_path = sessionStorage.getItem('redirect_path')
      if (redirect_path) {
        sessionStorage.removeItem('redirect_path')
        navigate(redirect_path)
      } else {
        navigate('/')
      }
      return
    }

    if (isError || (!isFetching && user === null)) {
      cancelAndRevalidate('/')
    }
  }, [isError, isFetching, navigate, oauthError, oauthTransitionOwner, queryClient, user])
  return (
    <Container>
      <Loader/>
      <div>正在處理 Google 登入...</div>
    </Container>
  )
}

export default OAuthCallbackPage
