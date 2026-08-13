import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAuthStatus } from '../../apis/authAPI'
import { useAuthStore } from '../../stores/authStore'
import {
    applyAuthStatusResponse,
    captureAuthStatusRequestSnapshot,
    isAuthSessionRecordCurrent,
} from '../../utils/userCacheScope'

export const useGetAuthStatus = (oauthTransitionOwner: string | null) => {
    const login = useAuthStore((state) => state.login)
    const logout = useAuthStore((state) => state.logout)

    return useQuery({
        queryKey: [QUERY_KEYS.AUTH_STATUS, oauthTransitionOwner ?? 'missing-owner'],
        queryFn: async({ signal }) => {
            const requestSnapshot = captureAuthStatusRequestSnapshot()
            const authStatus = await getAuthStatus(signal)
            if (useAuthStore.getState().isLogoutInProgress) return null
            if (!oauthTransitionOwner) return null

            const result = await applyAuthStatusResponse(requestSnapshot, authStatus, {
                transitionOwner: oauthTransitionOwner,
                transitionKind: 'oauth',
            })
            if (!result.applied || !isAuthSessionRecordCurrent(result.record)) return null

            if (authStatus.authenticated) {
                if (
                    result.record?.status === 'authenticated'
                    && result.record.sessionScope === authStatus.session_scope
                ) {
                    login(authStatus.user, authStatus.session_scope)
                }
                return authStatus.user
            }

            if (!authStatus.authenticated && result.record?.status === 'guest') logout()
            return null
        },
        enabled: Boolean(oauthTransitionOwner),
        retry: 1,
    })
}
