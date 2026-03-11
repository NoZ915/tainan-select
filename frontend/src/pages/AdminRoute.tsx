import { Loader, Text } from '@mantine/core'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useGetAdminStatus } from '../hooks/admin/useGetAdminStatus'

const AdminRoute: React.FC = () => {
  const location = useLocation()
  const { data, isLoading, isError } = useGetAdminStatus()

  if (isLoading) {
    return <Loader mt='xl' />
  }

  if (isError || !data?.isAdmin) {
    return (
      <>
        <Text ta='center' mt='xl'>此頁面僅限管理員使用</Text>
        <Navigate to='/' state={{ from: location }} replace />
      </>
    )
  }

  return <Outlet />
}

export default AdminRoute
