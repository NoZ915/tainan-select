import { axiosInstance } from './axiosInstance'

export const getSemesters = async (): Promise<{ items: string[] }> => {
  const response = await axiosInstance.get('/semesters')
  return response.data
}
