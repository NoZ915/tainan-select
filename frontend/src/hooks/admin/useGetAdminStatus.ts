import { useQuery } from '@tanstack/react-query'
import { getAdminStatus } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'

export const useGetAdminStatus = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_STATUS],
    queryFn: getAdminStatus,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
