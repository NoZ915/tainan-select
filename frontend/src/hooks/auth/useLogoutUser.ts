import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications } from '@mantine/notifications'
import { useAuthStore } from '../../stores/authStore'
import { logoutUser } from '../../apis/authAPI'
import { QUERY_KEYS } from '../queryKeys'
import {
    beginAuthSessionTransition,
    cancelAuthSessionTransition,
    captureAuthStatusRequestSnapshot,
    completeLogoutAuthSessionTransition,
    getUserCacheScope,
} from '../../utils/userCacheScope'

const USER_SCOPED_QUERY_KEYS = new Set([
    QUERY_KEYS.TIMETABLE,
    QUERY_KEYS.TIMETABLE_ALL_ITEMS,
    QUERY_KEYS.COURSE,
    QUERY_KEYS.REVIEWS,
    QUERY_KEYS.REVIEW_COMMENTS,
    QUERY_KEYS.LATEST_REVIEWS,
    QUERY_KEYS.INFINITY_REVIEWS,
    QUERY_KEYS.INTERESTS,
    QUERY_KEYS.INFINITY_INTERESTS,
    QUERY_KEYS.FEATURE_REQUESTS,
    QUERY_KEYS.ADMIN_STATUS,
    QUERY_KEYS.ADMIN_RELATED_POSTS_OVERVIEW,
])

export const useLogoutUser = () => {
    const logout = useAuthStore((state) => state.logout)
    const setIsLogoutInProgress = useAuthStore((state) => state.setIsLogoutInProgress)
    const queryClient = useQueryClient()

    const cancelAuthQueries = () => Promise.all([
        queryClient.cancelQueries({ queryKey: [QUERY_KEYS.AUTH_STATUS] }),
        queryClient.cancelQueries({ queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS] }),
    ])

    return useMutation({
        mutationFn: () => logoutUser(),
        onMutate: async () => {
            const userCacheScope = getUserCacheScope(useAuthStore.getState().user)
            const transition = await beginAuthSessionTransition('logout')
            if (!transition) {
                throw new Error('AUTH_TRANSITION_IN_PROGRESS')
            }
            setIsLogoutInProgress(true)
            await cancelAuthQueries()
            return { userCacheScope, transitionOwner: transition.owner }
        },
        onSuccess: async (_data, _variables, context) => {
            const completed = await completeLogoutAuthSessionTransition(context.transitionOwner)
            if (!completed) {
                setIsLogoutInProgress(false)
                return
            }

            await cancelAuthQueries()
            const matchesLoggedOutUserScope = (query: { queryKey: readonly unknown[] }) => (
                USER_SCOPED_QUERY_KEYS.has(String(query.queryKey[0]))
                && query.queryKey.includes(context.userCacheScope)
            )
            await queryClient.cancelQueries({ predicate: matchesLoggedOutUserScope })
            queryClient.removeQueries({ predicate: matchesLoggedOutUserScope })
            queryClient.setQueryData(
                [QUERY_KEYS.CHECK_AUTH_STATUS],
                {
                    authStatus: { authenticated: false as const },
                    requestSnapshot: captureAuthStatusRequestSnapshot(),
                },
            )
            logout()
        },
        onError: async (error, _variables, context) => {
            if (context?.transitionOwner) {
                await cancelAuthSessionTransition(context.transitionOwner)
            }
            setIsLogoutInProgress(false)
            if (error instanceof Error && error.message === 'AUTH_TRANSITION_IN_PROGRESS') {
                notifications.show({
                    title: '登入狀態正在更新',
                    message: '目前正在處理登入，請稍後再登出。',
                    color: 'orange',
                })
                return
            }
            console.error('登出失敗')
            await Promise.all([
                queryClient.refetchQueries({
                    queryKey: [QUERY_KEYS.AUTH_STATUS],
                    type: 'active',
                }),
                queryClient.refetchQueries({
                    queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS],
                    type: 'active',
                }),
            ])
        },
    })
}
