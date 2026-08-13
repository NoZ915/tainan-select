import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { removeTimetableCourse } from '../../apis/timetableAPI'
import { useAuthStore } from '../../stores/authStore'
import type { AddedCourseItem, TimetableResponse } from '../../types/timetableType'
import { getUserCacheScope } from '../../utils/userCacheScope'
import { QUERY_KEYS } from '../queryKeys'

type RemovePayload = {
  timetableId: number
  courseId: number
  semester: string
}

export const useRemoveTimetableCourse = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ timetableId, courseId }: RemovePayload) => {
      const userCacheScope = getUserCacheScope(useAuthStore.getState().user)
      await removeTimetableCourse(timetableId, courseId, {
        expectedSessionScope: userCacheScope,
      })
      return { userCacheScope }
    },
    onSuccess: ({ userCacheScope }, variables) => {
      queryClient.setQueryData<TimetableResponse>(
        [QUERY_KEYS.TIMETABLE, variables.semester, userCacheScope],
        (current) => current ? {
          ...current,
          items: current.items.filter((item) => item.course.id !== variables.courseId),
        } : current,
      )
      queryClient.setQueryData<{ items: AddedCourseItem[] }>(
        [QUERY_KEYS.TIMETABLE_ALL_ITEMS, userCacheScope],
        (current) => current ? {
          items: current.items.filter((item) => !(
            item.semester === variables.semester
            && item.course.id === variables.courseId
          )),
        } : current,
      )
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TIMETABLE, variables.semester, userCacheScope],
        }),
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS, userCacheScope],
        }),
      ])
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
