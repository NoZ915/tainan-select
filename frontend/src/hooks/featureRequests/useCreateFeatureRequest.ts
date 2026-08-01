import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFeatureRequest } from '../../apis/featureRequestAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useCreateFeatureRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (content: string) => createFeatureRequest(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FEATURE_REQUESTS] })
    },
  })
}