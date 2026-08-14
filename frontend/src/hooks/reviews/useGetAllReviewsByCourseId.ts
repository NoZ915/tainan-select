import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAllReviewsByCourseId } from '../../apis/reviewAPI'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetAllReviewsByCourseId = (course_id: string) => {
    const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

    return useQuery({
        queryKey: [QUERY_KEYS.REVIEWS, course_id, userCacheScope],
        queryFn: () => getAllReviewsByCourseId(course_id),
        enabled: Boolean(course_id),
    })
}
