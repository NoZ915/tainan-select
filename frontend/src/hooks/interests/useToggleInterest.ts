import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toggleInterest } from '../../apis/interestAPI'
import { CourseDetailResponse } from '../../types/courseType'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'
import { QUERY_KEYS } from '../queryKeys'

export const useToggleInterest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (course_id: number) => toggleInterest(course_id),
		onMutate: () => ({
			userCacheScope: getUserCacheScope(useAuthStore.getState().user),
		}),
		onSuccess: (data, course_id, context) => {
			const courseIdKey = String(course_id)
			queryClient.setQueryData(
				[QUERY_KEYS.COURSE, courseIdKey, context.userCacheScope],
				(oldData: CourseDetailResponse | undefined) => {
				if (!oldData) return oldData
				return {
					...oldData,
					hasUserAddInterest: data.isInterest
				}
			})
			queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.COURSE, courseIdKey, context.userCacheScope],
			})
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INTERESTS] })
			queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_INTERESTS] })
		},
	})
}
