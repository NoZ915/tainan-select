import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateReviewComment } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useUpdateReviewComment = (review_id: number) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ comment_id, content }: { comment_id: number; content: string }) =>
      updateReviewComment(review_id, comment_id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEW_COMMENTS, review_id] })
    },
  })
}
