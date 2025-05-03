import { useMutation } from "@tanstack/react-query";
import { updateUser } from "../../apis/userAPI";
import { useAuthStore } from "../../stores/authStore";
import { notifications } from '@mantine/notifications';

export const useUpdateUser = () => {
  const { user, login } = useAuthStore.getState();

  return useMutation({
    mutationFn: (name: string) => updateUser(name),
    onSuccess: (name) => {
      if (user) {
        login({ ...user, name });
        notifications.show({
          title: "更新成功",
          message: "暱稱已更新",
          color: "green",
        });
      }
    },
    onError: (error) => {
      notifications.show({
        title: "更新失敗",
        message: error.message,
        color: "red",
        autoClose: 4000,
        withCloseButton: true,
      });
    },
  })
}