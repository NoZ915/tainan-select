import { useQuery } from '@tanstack/react-query'
import { getFeatureRequests } from '../../apis/featureRequestAPI'
import { FeatureRequestStatus } from '../../types/featureRequestType'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'

export const useGetFeatureRequests = (status?: FeatureRequestStatus) => {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: [QUERY_KEYS.FEATURE_REQUESTS, status ?? 'all', userId ?? 'anonymous'],
    queryFn: () => getFeatureRequests(status),
    staleTime: 1000 * 60,
  })
}