import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createReviewComment } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useCreateReviewComment = (review_id: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => createReviewComment(review_id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEW_COMMENTS, review_id] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LATEST_REVIEWS] })
    },
  })
}
