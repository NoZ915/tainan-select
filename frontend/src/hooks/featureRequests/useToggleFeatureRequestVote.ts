import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleFeatureRequestVote } from '../../apis/featureRequestAPI'
import { FeatureRequest } from '../../types/featureRequestType'
import { useAuthStore } from '../../stores/authStore'
import { QUERY_KEYS } from '../queryKeys'
import { getUserCacheScope } from '../../utils/userCacheScope'

export const useToggleFeatureRequestVote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toggleFeatureRequestVote(id),
    onMutate: () => ({ userKey: getUserCacheScope(useAuthStore.getState().user) }),
    onSuccess: (data, id, context) => {
      queryClient.setQueriesData<FeatureRequest[]>(
        { queryKey: [QUERY_KEYS.FEATURE_REQUESTS] },
        (oldData) =>
          oldData
            ?.map((item) => (item.id === id ? { ...item, vote_count: data.vote_count } : item))
            .sort((firstItem, secondItem) => {
              if (secondItem.vote_count !== firstItem.vote_count) return secondItem.vote_count - firstItem.vote_count
              return new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime()
            })
      )

      queryClient.setQueriesData<FeatureRequest[]>(
        {
          queryKey: [QUERY_KEYS.FEATURE_REQUESTS],
          predicate: (query) => query.queryKey[2] === context.userKey,
        },
        (oldData) =>
          oldData?.map((item) => (item.id === id ? { ...item, has_voted: data.has_voted } : item))
      )
    },
  })
}
