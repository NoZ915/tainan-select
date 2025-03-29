import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../stores/authStore"
import { logoutUser } from "../../apis/authAPI";

export const useLogoutUser = () => {
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: () => logoutUser(),
        onSuccess: () => logout(),
        onError: () => console.error("登出失敗")
    })
}