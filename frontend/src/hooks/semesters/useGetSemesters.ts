import { useQuery } from '@tanstack/react-query'
import { getSemesters } from '../../apis/semesterAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetSemesters = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEMESTERS],
    queryFn: getSemesters,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  })
}
