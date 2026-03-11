import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { logoutUser } from '../../apis/authAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useLogoutUser = () => {
    const logout = useAuthStore((state) => state.logout)
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () => logoutUser(),
        onSuccess: () => {
            logout()
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COURSE] })
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH_STATUS] })
            queryClient.removeQueries({ queryKey: [QUERY_KEYS.ADMIN_STATUS] })
            queryClient.removeQueries({ queryKey: [QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW] })
        },
        onError: () => console.error('登出失敗')
    })
}
