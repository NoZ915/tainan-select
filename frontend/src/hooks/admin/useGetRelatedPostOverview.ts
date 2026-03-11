import { useQuery } from '@tanstack/react-query'
import { getRelatedPostOverview } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetRelatedPostOverview = (params: {
  recentPostsPage: number;
  recentImportsPage: number;
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW, params],
    queryFn: () => getRelatedPostOverview(params),
  })
}
