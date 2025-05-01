import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../apis/userAPI";
import { useAuthStore } from "../../stores/authStore";

export const useUpdateUser = () => {
  const { user, login } = useAuthStore.getState();

  return useMutation({
    mutationFn: (name: string) => updateUser(name),
    onSuccess: (name) => {
      if (user) {
        login({ ...user, name });
      }
    },
    onError: (err) => console.log(err),
  })
}