import { useInfiniteQuery } from '@tanstack/react-query'
import { getAllReviewsByUserId } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetAllReviewsByUserId = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.INFINITY_REVIEWS],
    queryFn: getAllReviewsByUserId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0)
      if (loadedCount >= lastPage.count) return undefined
      return loadedCount
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  })
}
