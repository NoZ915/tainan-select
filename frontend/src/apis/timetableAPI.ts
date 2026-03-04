import { axiosInstance } from './axiosInstance'
import { AddTimetableCourseResponse, AddedCourseItem, BatchAddFromInterestsResponse, TimetableResponse } from '../types/timetableType'

export const getTimetableBySemester = async (semester: string): Promise<TimetableResponse> => {
  const response = await axiosInstance.get('/timetables', {
    params: { semester },
  })
  return response.data
}

export const getAllTimetableItems = async (): Promise<{ items: AddedCourseItem[] }> => {
  const response = await axiosInstance.get('/timetables/items')
  return response.data
}

export const batchAddTimetableFromInterests = async (timetableId: number): Promise<BatchAddFromInterestsResponse> => {
  const response = await axiosInstance.post(`/timetables/${timetableId}/items/batch-from-interests`)
  return response.data
}

export const addTimetableCourse = async (timetableId: number, courseId: number): Promise<AddTimetableCourseResponse> => {
  const response = await axiosInstance.post(`/timetables/${timetableId}/items`, { courseId })
  return response.data
}

export const removeTimetableCourse = async (timetableId: number, courseId: number): Promise<void> => {
  await axiosInstance.delete(`/timetables/${timetableId}/items/${courseId}`)
}
