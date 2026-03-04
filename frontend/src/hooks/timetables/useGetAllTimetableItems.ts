import { useQuery } from '@tanstack/react-query'
import { getAllTimetableItems } from '../../apis/timetableAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetAllTimetableItems = (enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS],
    queryFn: getAllTimetableItems,
    enabled,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  })
}
