import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { addTimetableCourse } from '../../apis/timetableAPI'
import { ApiError } from '../../apis/axiosInstance'
import { QUERY_KEYS } from '../queryKeys'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'

type AddPayload = {
  timetableId: number
  courseId: number
  semester: string
}

export const useAddTimetableCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ timetableId, courseId }: AddPayload) => {
      const userCacheScope = getUserCacheScope(useAuthStore.getState().user)
      const result = await addTimetableCourse(timetableId, courseId, {
        expectedSessionScope: userCacheScope,
      })
      return { result, userCacheScope }
    },
    onSuccess: ({ result: data, userCacheScope }, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TIMETABLE, variables.semester, userCacheScope],
      })
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS, userCacheScope],
      })

      if (data.added) {
        notifications.show({
          title: '已加入課表',
          message: '課程已加入這學期課表',
          color: 'green',
        })
        return
      }

      if (data.alreadyExists) {
        notifications.show({
          title: '已存在',
          message: '這門課已經在課表中',
          color: 'blue',
        })
      }
    },
    onError: (error) => {
      const typedError = error as ApiError
      const errorData = typedError.data as { conflicts?: unknown[] } | undefined
      if (typedError.status === 409 && errorData?.conflicts && errorData.conflicts.length > 0) {
        return
      }
      notifications.show({
        title: '加入失敗',
        message: error.message,
        color: 'red',
      })
    },
  })
}
