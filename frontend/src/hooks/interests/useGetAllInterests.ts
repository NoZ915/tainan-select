import { useInfiniteQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAllInterests } from '../../apis/interestAPI'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetAllInterests = () => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
    const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

    return useInfiniteQuery({
        queryKey: [QUERY_KEYS.INFINITY_INTERESTS, userCacheScope],
        queryFn: getAllInterests,
        enabled: isAuthResolved && isAuthenticated,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0)
            if (loadedCount >= lastPage.count) {
                return undefined
            }
            return loadedCount
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
    })
}
