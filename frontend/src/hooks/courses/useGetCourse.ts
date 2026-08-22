import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getCourse } from '../../apis/courseAPI'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const canFetchCourse = (courseId: string, isAuthResolved: boolean): boolean => (
    Boolean(courseId) && isAuthResolved
)

export const useGetCourse = (course_id: string) => {
    const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const isAuthResolved = useAuthStore((state) => state.isAuthResolved)

    return useQuery({
        queryKey: [QUERY_KEYS.COURSE, course_id, userCacheScope],
        queryFn: () => getCourse(course_id, { isAuthenticated }),
        enabled: canFetchCourse(course_id, isAuthResolved),
        staleTime: 5 * 60 * 1000,
    })
}
