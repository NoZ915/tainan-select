import { useQuery } from '@tanstack/react-query'
import { getReviewComments } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetReviewComments = (review_id: number, enabled: boolean) => {
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

  return useQuery({
    queryKey: [QUERY_KEYS.REVIEW_COMMENTS, review_id, userCacheScope],
    queryFn: () => getReviewComments(review_id),
    enabled,
  })
}
