import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { checkAuthStatus } from "../../apis/authAPI"

export const useCheckAuthStatus = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.CHECK_AUTH_STATUS],
        queryFn: () => checkAuthStatus()
    })
}