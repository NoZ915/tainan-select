import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { notifications } from '@mantine/notifications'

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuthStore()  // 使用zustand管理的認證狀態
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      notifications.show({
        title: '尚未登入',
        message: '請先登入帳號',
        color: 'red',
    })
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to='/' state={{ from: location }} />
}

  return (
    <Outlet />
  )
}

export default ProtectedRoute