import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleInterest } from '../../apis/interestAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useToggleInterest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (course_id: number) => toggleInterest(course_id),
		onSuccess: (data, course_id) => {
			const courseIdKey = String(course_id)
			queryClient.setQueryData([QUERY_KEYS.COURSE, courseIdKey], (oldData: { course: { interests_count: number }, hasUserAddInterest: boolean } | undefined) => {
				if (!oldData) return oldData
				return {
					...oldData,
					hasUserAddInterest: data.isInterest
				}
			})
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COURSE, courseIdKey] })
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INTERESTS] })
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_INTERESTS] })
		},
	})
}
