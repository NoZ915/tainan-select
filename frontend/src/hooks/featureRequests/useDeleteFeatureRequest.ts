import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteFeatureRequest } from '../../apis/featureRequestAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useDeleteFeatureRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteFeatureRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEATURE_REQUESTS] })
    },
  })
}