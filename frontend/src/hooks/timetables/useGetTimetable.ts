import { useQuery } from '@tanstack/react-query'
import { getTimetableBySemester } from '../../apis/timetableAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetTimetable = (semester: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TIMETABLE, semester],
    queryFn: () => getTimetableBySemester(semester as string),
    enabled: enabled && Boolean(semester),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })
}
