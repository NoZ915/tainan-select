import { useQuery } from '@tanstack/react-query'
import { getReviewComments } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'

export const useGetReviewComments = (review_id: number, enabled: boolean) => {
  const userId = useAuthStore((state) => state.user?.id ?? 'guest')

  return useQuery({
    queryKey: [QUERY_KEYS.REVIEW_COMMENTS, review_id, userId],
    queryFn: () => getReviewComments(review_id),
    enabled,
  })
}
