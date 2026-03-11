import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRelatedPostImport } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useDeleteRelatedPostImport = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRelatedPostImport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
    },
  })
}
