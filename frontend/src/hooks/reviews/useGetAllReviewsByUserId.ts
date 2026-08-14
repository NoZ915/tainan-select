import { useInfiniteQuery } from '@tanstack/react-query'
import { getAllReviewsByUserId } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useGetAllReviewsByUserId = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.INFINITY_REVIEWS, userCacheScope],
    queryFn: getAllReviewsByUserId,
    enabled: isAuthResolved && isAuthenticated,
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
