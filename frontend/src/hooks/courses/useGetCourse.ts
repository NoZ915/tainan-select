import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getCourse } from '../../apis/courseAPI'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetCourse = (course_id: string) => {
    const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

    return useQuery({
        queryKey: [QUERY_KEYS.COURSE, course_id, userCacheScope],
        queryFn: () => getCourse(course_id),
        enabled: !!course_id,
        staleTime: 5 * 60 * 1000,
    })
}
