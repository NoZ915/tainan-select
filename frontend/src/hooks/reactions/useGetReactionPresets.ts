import { useQuery } from '@tanstack/react-query'
import { getReactionPresets } from '../../apis/reactionAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useGetReactionPresets = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.REACTION_PRESETS],
    queryFn: () => getReactionPresets(),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  })
}
