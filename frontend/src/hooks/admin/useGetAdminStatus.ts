import { useQuery } from '@tanstack/react-query'
import { getAdminStatus } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'

export const useGetAdminStatus = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_STATUS, userId],
    queryFn: getAdminStatus,
    enabled: isAuthenticated && Boolean(userId),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
