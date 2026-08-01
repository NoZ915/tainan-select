import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFeatureRequestStatus } from '../../apis/featureRequestAPI'
import { FeatureRequestStatus } from '../../types/featureRequestType'
import { QUERY_KEYS } from '../queryKeys'

export const useUpdateFeatureRequestStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: FeatureRequestStatus }) =>
      updateFeatureRequestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEATURE_REQUESTS] })
    },
  })
}