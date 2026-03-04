import { useEffect, useRef } from 'react'
import { useGetAuthStatus } from '../hooks/auth/useGetAuthStatus'
import { useLocation, useNavigate } from 'react-router-dom'
import { Container, Loader } from '@mantine/core'

const OAuthCallbackPage: React.FC = () => {
  const { data: user } = useGetAuthStatus()
  const navigate = useNavigate()
  const location = useLocation()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (hasRedirected.current) return
  
    const searchParams = new URLSearchParams(location.search)
    const error = searchParams.get('error')
  
    if (error === 'invalid_email') {
      hasRedirected.current = true
      localStorage.removeItem('redirect_path')
      navigate('/mailError')
      return
    }
  
    if (user) {
      hasRedirected.current = true
      const redirect_path = localStorage.getItem('redirect_path')
      if (redirect_path) {
        localStorage.removeItem('redirect_path')
        navigate(redirect_path)
      } else {
        navigate('/')
      }
    }
  }, [location.search, navigate, user])
  return (
    <Container>
      <Loader/>
      <div>正在處理 Google 登入...</div>
    </Container>
  )
}

export default OAuthCallbackPage