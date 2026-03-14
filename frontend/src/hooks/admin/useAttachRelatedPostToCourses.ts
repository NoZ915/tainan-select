import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attachRelatedPostToCourses } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useAttachRelatedPostToCourses = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, course_ids }: { id: number; course_ids: number[] }) =>
      attachRelatedPostToCourses(id, { course_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
    },
  })
}
