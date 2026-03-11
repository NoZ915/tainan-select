import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRelatedPost } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useDeleteRelatedPost = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRelatedPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
    },
  })
}
