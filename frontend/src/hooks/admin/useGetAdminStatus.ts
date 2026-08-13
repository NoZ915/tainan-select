import { useQuery } from '@tanstack/react-query'
import { getAdminStatus } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetAdminStatus = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_STATUS, userCacheScope],
    queryFn: getAdminStatus,
    enabled: isAuthResolved && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
