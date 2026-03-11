import { useQuery } from '@tanstack/react-query'
import { getRelatedPostOverview } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'

export const useGetRelatedPostOverview = (params: {
  recentPostsPage: number;
  recentImportsPage: number;
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW, userId ?? 'authenticated', params],
    queryFn: () => getRelatedPostOverview(params),
    enabled: isAuthenticated,
  })
}
