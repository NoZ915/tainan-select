import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

import { updateUser } from '../../apis/userAPI'
import { useAuthStore } from '../../stores/authStore'
import { QUERY_KEYS } from '../queryKeys'

export const useUpdateUser = () => {
  const login = useAuthStore((state) => state.login)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => updateUser(name),
    onSuccess: (name) => {
      const latestUser = useAuthStore.getState().user
      if (latestUser) {
        login({ ...latestUser, name })
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LATEST_REVIEWS] })

      notifications.show({
        title: '更新成功',
        message: '已更新個人名稱',
        color: 'green',
      })
    },
    onError: (error) => {
      notifications.show({
        title: '更新失敗',
        message: error.message,
        color: 'red',
        autoClose: 4000,
        withCloseButton: true,
      })
    },
  })
}