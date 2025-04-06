import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore"
import { logoutUser } from "../../apis/authAPI";
import { QUERY_KEYS } from "../queryKeys";

export const useLogoutUser = () => {
    const logout = useAuthStore((state) => state.logout);
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => logoutUser(),
        onSuccess: () => {
            logout();
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COURSE] });
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.AUTH_STATUS] });
        },
        onError: () => console.error("登出失敗")
    })
}