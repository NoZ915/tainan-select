import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importDcardSource } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useImportDcardSource = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: importDcardSource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
    },
  })
}
