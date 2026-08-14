import { useQuery } from '@tanstack/react-query'
import { getRelatedPostOverview } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetRelatedPostOverview = (params: {
  recentPostsPage: number;
  recentImportsPage: number;
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW, userCacheScope, params],
    queryFn: () => getRelatedPostOverview(params),
    enabled: isAuthResolved && isAuthenticated,
    placeholderData: (previousData) => previousData,
  })
}
