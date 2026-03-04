import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getCourse } from '../../apis/courseAPI'

export const useGetCourse = (course_id: string) => {
    return useQuery({
        queryKey: [QUERY_KEYS.COURSE, course_id],
        queryFn: () => getCourse(course_id),
        enabled: !!course_id,
        staleTime: 5 * 60 * 1000,
    })
}