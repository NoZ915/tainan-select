import { useMutation, useQueryClient } from '@tanstack/react-query'
import { attachRelatedPostToCourses } from '../../apis/adminAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useAttachRelatedPostToCourses = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      course_ids,
      course_keyword_overrides,
    }: {
      id: number;
      course_ids: number[];
      course_keyword_overrides?: Array<{ course_id: number; manual_keywords?: string[] }>;
    }) =>
      attachRelatedPostToCourses(id, { course_ids, course_keyword_overrides }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
    },
  })
}
