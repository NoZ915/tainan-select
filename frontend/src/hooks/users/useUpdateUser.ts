import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../apis/userAPI";
import { QUERY_KEYS } from "../queryKeys";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => updateUser(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER] });
    },
    onError: (err) => console.log(err),
  })
}