import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { addTimetableCourse } from '../../apis/timetableAPI'
import { ApiError } from '../../apis/axiosInstance'
import { QUERY_KEYS } from '../queryKeys'

type AddPayload = {
  timetableId: number
  courseId: number
  semester: string
}

export const useAddTimetableCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ timetableId, courseId }: AddPayload) => addTimetableCourse(timetableId, courseId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE, variables.semester] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] })

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
