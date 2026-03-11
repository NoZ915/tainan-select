import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteReviewComment } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useDeleteReviewComment = (review_id: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (comment_id: number) => deleteReviewComment(review_id, comment_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEW_COMMENTS, review_id] })
    },
  })
}
