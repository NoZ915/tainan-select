import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'

import { updateUser } from '../../apis/userAPI'
import { useAuthStore } from '../../stores/authStore'
import { getUserCacheScope } from '../../utils/userCacheScope'
import { QUERY_KEYS } from '../queryKeys'

const useUpdateUserBase = (successMessage: string) => {
  const updateStoredUser = useAuthStore((state) => state.updateUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateUser,
    onMutate: () => ({
      userCacheScope: getUserCacheScope(useAuthStore.getState().user),
    }),
    onSuccess: ({ name, avatar }, _variables, context) => {
      const latestUser = useAuthStore.getState().user
      if (
        latestUser
        && getUserCacheScope(latestUser) === context.userCacheScope
      ) {
        updateStoredUser({ ...latestUser, name, avatar })
      }

      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_REVIEWS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LATEST_REVIEWS] })

      notifications.show({
        title: '更新成功',
        message: successMessage,
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

export const useUpdateUserName = () => useUpdateUserBase('已更新個人名稱')

export const useUpdateUserAvatar = () => useUpdateUserBase('已更新頭像')
