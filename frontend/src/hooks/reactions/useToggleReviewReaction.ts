import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleReviewReaction } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

interface ToggleReviewReactionInput {
  review_id: number;
  key: string;
}

export const useToggleReviewReaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ review_id, key }: ToggleReviewReactionInput) => toggleReviewReaction(review_id, key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LATEST_REVIEWS] })
    },
    onError: (err) => console.log(err)
  })
}
