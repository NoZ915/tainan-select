import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleFeatureRequestVote } from '../../apis/featureRequestAPI'
import { FeatureRequest } from '../../types/featureRequestType'
import { QUERY_KEYS } from '../queryKeys'

export const useToggleFeatureRequestVote = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => toggleFeatureRequestVote(id),
    onSuccess: (data, id) => {
      queryClient.setQueriesData<FeatureRequest[]>(
        { queryKey: [QUERY_KEYS.FEATURE_REQUESTS] },
        (oldData) =>
          oldData
            ?.map((item) =>
              item.id === id ? { ...item, has_voted: data.has_voted, vote_count: data.vote_count } : item
            )
            .sort((firstItem, secondItem) => {
              if (secondItem.vote_count !== firstItem.vote_count) return secondItem.vote_count - firstItem.vote_count
              return new Date(secondItem.created_at).getTime() - new Date(firstItem.created_at).getTime()
            })
      )
    },
  })
}