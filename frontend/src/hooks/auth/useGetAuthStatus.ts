import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAuthStatus } from '../../apis/authAPI'
import { useAuthStore } from '../../stores/authStore'

export const useGetAuthStatus = () => {
    const login = useAuthStore((state) => state.login)
    const logout = useAuthStore((state) => state.logout)

    return useQuery({
        queryKey: [QUERY_KEYS.AUTH_STATUS],
        queryFn: async() => {
            const { authenticated, user } = await getAuthStatus()
            if(authenticated){
                login(user)
            }else{
                logout()
            }
            return user
        }
    })
}