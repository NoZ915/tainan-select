import { useQuery } from '@tanstack/react-query'
import { getTimetableBySemester } from '../../apis/timetableAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetTimetable = (semester: string | null, enabled: boolean) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
  const isAccountQueryEnabled = enabled && isAuthResolved && isAuthenticated

  return useQuery({
    queryKey: [QUERY_KEYS.TIMETABLE, semester, userCacheScope],
    queryFn: ({ signal }) => getTimetableBySemester(semester as string, {
      signal,
      expectedSessionScope: userCacheScope,
    }),
    enabled: isAccountQueryEnabled && Boolean(semester),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })
}
