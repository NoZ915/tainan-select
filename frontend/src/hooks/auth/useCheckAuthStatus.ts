import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { checkAuthStatus } from '../../apis/authAPI'
import { captureAuthStatusRequestSnapshot } from '../../utils/userCacheScope'

export const useCheckAuthStatus = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS],
        queryFn: async ({ signal }) => {
            const requestSnapshot = captureAuthStatusRequestSnapshot()
            const authStatus = await checkAuthStatus(signal)
            return { authStatus, requestSnapshot }
        },
        retry: 1,
    })
}
