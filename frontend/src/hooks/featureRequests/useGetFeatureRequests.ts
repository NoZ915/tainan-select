import { useQuery } from '@tanstack/react-query'
import { getFeatureRequests } from '../../apis/featureRequestAPI'
import { FeatureRequestStatus } from '../../types/featureRequestType'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetFeatureRequests = (status?: FeatureRequestStatus) => {
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

  return useQuery({
    queryKey: [QUERY_KEYS.FEATURE_REQUESTS, status ?? 'all', userCacheScope],
    queryFn: () => getFeatureRequests(status),
    staleTime: 1000 * 60,
  })
}
