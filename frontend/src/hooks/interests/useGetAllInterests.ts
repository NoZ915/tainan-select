import { useInfiniteQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAllInterests } from '../../apis/interestAPI'

export const useGetAllInterests = () => {
    return useInfiniteQuery({
        queryKey: [QUERY_KEYS.INFINITY_INTERESTS],
        queryFn: getAllInterests,
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
