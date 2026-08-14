import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { batchAddTimetableFromInterests } from '../../apis/timetableAPI'
import { QUERY_KEYS } from '../queryKeys'

type BatchAddPayload = {
  timetableId: number
  semester: string
}

export const useBatchAddTimetableFromInterests = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ timetableId }: BatchAddPayload) => batchAddTimetableFromInterests(timetableId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE, variables.semester] })

      const { added, conflicted, skippedAlreadyExists } = data.summary
      if (conflicted > 0) {
        notifications.show({
          title: '已完成批次加入（含撞課）',
          message: `成功加入 ${added} 門，撞課 ${conflicted} 門，已存在 ${skippedAlreadyExists} 門`,
          color: 'orange',
          autoClose: 5000,
        })
      } else {
        notifications.show({
          title: '批次加入完成',
          message: `成功加入 ${added} 門，已存在 ${skippedAlreadyExists} 門`,
          color: 'green',
        })
      }
    },
    onError: (error) => {
      notifications.show({
        title: '批次加入失敗',
        message: error.message,
        color: 'red',
      })
    },
  })
}
