import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { Loader } from '@mantine/core'

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isAuthResolved } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    if (isAuthResolved && !isAuthenticated) {
      notifications.show({
        title: '尚未登入',
        message: '請先登入帳號',
        color: 'red',
      })
    }
  }, [isAuthenticated, isAuthResolved])

  if (!isAuthResolved) {
    return <Loader mt='xl' />
  }

  if (!isAuthenticated) {
    return <Navigate to='/' state={{ from: location }} />
  }

  return (
    <Outlet />
  )
}

export default ProtectedRoute
