import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAllReviewsByCourseId } from '../../apis/reviewAPI'

export const useGetAllReviewsByCourseId = (course_id: string) => {
    return useQuery({
        queryKey: [QUERY_KEYS.REVIEWS],
        queryFn: () => getAllReviewsByCourseId(course_id)
    })
}