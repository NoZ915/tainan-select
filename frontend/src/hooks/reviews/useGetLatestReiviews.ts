import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getLatestReviews } from '../../apis/reviewAPI'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetLatestReviews = () => {
    const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

    return useQuery({
        queryKey: [QUERY_KEYS.LATEST_REVIEWS, userCacheScope],
        queryFn: () => getLatestReviews()
    })
}
