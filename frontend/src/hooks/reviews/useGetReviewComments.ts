import { useQuery } from '@tanstack/react-query'
import { getReviewComments } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetReviewComments = (review_id: number, enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEYS.REVIEW_COMMENTS, review_id],
    queryFn: () => getReviewComments(review_id),
    enabled,
  })
}
