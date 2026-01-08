import { useQuery } from '@tanstack/react-query'
import { getCourses } from '../../apis/courseAPI'
import { SearchParams } from '../../types/courseType'
import { QUERY_KEYS } from '../queryKeys'

export const useGetCourses = (searchParams: SearchParams) => {
  return useQuery({
    queryKey: [QUERY_KEYS.COURSES, ...Object.values(searchParams)],
    queryFn: () => getCourses(searchParams),
    placeholderData: (prev) => prev,
  })
}
