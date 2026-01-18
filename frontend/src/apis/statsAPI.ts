import { axiosInstance } from './axiosInstance'
import { PlatformStats } from '../types/statsType'

export const getPlatformStats = async (): Promise<PlatformStats> => {
  const response = await axiosInstance.get('/stats')
  return response.data
}
