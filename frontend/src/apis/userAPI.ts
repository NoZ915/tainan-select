import { axiosInstance } from "./axiosInstance";

export const updateUser = async (name: string): Promise<void> => {
  const response = await axiosInstance.patch(`/users/updateUser`, { name });
  return response.data;
}