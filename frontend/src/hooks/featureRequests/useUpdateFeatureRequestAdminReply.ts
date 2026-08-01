import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFeatureRequestAdminReply } from '../../apis/featureRequestAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useUpdateFeatureRequestAdminReply = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, admin_reply }: { id: number; admin_reply: string }) =>
      updateFeatureRequestAdminReply(id, admin_reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEATURE_REQUESTS] })
    },
  })
}