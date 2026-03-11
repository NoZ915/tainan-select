import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncRelatedPostsFromGoogle } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useSyncRelatedPostsFromGoogle = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: syncRelatedPostsFromGoogle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
    },
  })
}
