import { axiosInstance } from './axiosInstance'

export interface UpdateUserPayload {
  name?: string
  avatar?: string | null
}

export interface UpdateUserResponse {
  name: string
  avatar: string | null
}

export const updateUser = async (payload: UpdateUserPayload): Promise<UpdateUserResponse> => {
  const response = await axiosInstance.patch('/users/updateUser', payload)
  return response.data
}
