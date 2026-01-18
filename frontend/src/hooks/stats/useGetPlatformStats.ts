import { useQuery } from '@tanstack/react-query'
import { getPlatformStats } from '../../apis/statsAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetPlatformStats = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.PLATFORM_STATS],
    queryFn: () => getPlatformStats(),
  })
}
