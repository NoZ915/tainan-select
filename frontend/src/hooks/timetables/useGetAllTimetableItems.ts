import { useQuery } from '@tanstack/react-query'
import { getAllTimetableItems } from '../../apis/timetableAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetAllTimetableItems = (enabled: boolean) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
  const isAccountQueryEnabled = enabled && isAuthResolved && isAuthenticated

  return useQuery({
    queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS, userCacheScope],
    queryFn: ({ signal }) => getAllTimetableItems({
      signal,
      expectedSessionScope: userCacheScope,
    }),
    enabled: isAccountQueryEnabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })
}
