import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { removeTimetableCourse } from '../../apis/timetableAPI'
import { QUERY_KEYS } from '../queryKeys'

type RemovePayload = {
  timetableId: number
  courseId: number
  semester: string
}

export const useRemoveTimetableCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ timetableId, courseId }: RemovePayload) => removeTimetableCourse(timetableId, courseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE, variables.semester] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] })
      notifications.show({
        title: '已移除課程',
        message: '課程已從課表移除',
        color: 'green',
      })
    },
    onError: (error) => {
      notifications.show({
        title: '移除失敗',
        message: error.message,
        color: 'red',
      })
    },
  })
}
