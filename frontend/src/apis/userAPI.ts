import { axiosInstance } from './axiosInstance'

export const updateUser = async (name: string): Promise<string> => {
  const response = await axiosInstance.patch('/users/updateUser', { name })
  return response.data
}