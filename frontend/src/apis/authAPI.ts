import { AuthStatusResponse } from '../types/authType'
import { axiosInstance } from './axiosInstance'

export const getAuthStatus = async (signal?: AbortSignal): Promise<AuthStatusResponse> => {
  const response = await axiosInstance.get('/auth/status', { signal, timeout: 15_000 })
  return response.data
}

export const checkAuthStatus = async (signal?: AbortSignal): Promise<AuthStatusResponse> => {
  const response = await axiosInstance.get('/auth/checkStatus', { signal, timeout: 15_000 })
  return response.data
}

export const logoutUser = async (): Promise<void> => {
  await axiosInstance.post('/auth/logout')
}
