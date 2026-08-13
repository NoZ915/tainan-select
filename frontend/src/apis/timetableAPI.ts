import { axiosInstance } from './axiosInstance'
import {
  AddTimetableCourseResponse,
  AddedCourseItem,
  SwapTimetableCourseResponse,
  TimetableResponse
} from '../types/timetableType'

type TimetableRequestContext = {
  signal?: AbortSignal
  expectedSessionScope: string
}

const getSessionHeaders = (expectedSessionScope?: string) => expectedSessionScope
  ? { 'X-Expected-Session-Scope': expectedSessionScope }
  : undefined

export const getTimetableBySemester = async (
  semester: string,
  context: TimetableRequestContext,
): Promise<TimetableResponse> => {
  const response = await axiosInstance.get('/timetables', {
    params: { semester },
    signal: context.signal,
    headers: getSessionHeaders(context.expectedSessionScope),
  })
  return response.data
}

export const getAllTimetableItems = async (
  context: TimetableRequestContext,
): Promise<{ items: AddedCourseItem[] }> => {
  const response = await axiosInstance.get('/timetables/items', {
    signal: context.signal,
    headers: getSessionHeaders(context.expectedSessionScope),
  })
  return response.data
}

export const addTimetableCourse = async (
  timetableId: number,
  courseId: number,
  context: TimetableRequestContext,
): Promise<AddTimetableCourseResponse> => {
  const response = await axiosInstance.post(
    `/timetables/${timetableId}/items`,
    { courseId },
    {
      signal: context.signal,
      headers: getSessionHeaders(context.expectedSessionScope),
    },
  )
  return response.data
}

export const removeTimetableCourse = async (
  timetableId: number,
  courseId: number,
  context: TimetableRequestContext,
): Promise<void> => {
  await axiosInstance.delete(`/timetables/${timetableId}/items/${courseId}`, {
    signal: context.signal,
    headers: getSessionHeaders(context.expectedSessionScope),
  })
}

export const swapTimetableCourse = async (
  timetableId: number,
  courseId: number,
  conflictCourseIds: readonly number[],
  context: TimetableRequestContext,
): Promise<SwapTimetableCourseResponse> => {
  const response = await axiosInstance.post(
    `/timetables/${timetableId}/items/swap`,
    {
      courseId,
      conflictCourseIds,
    },
    {
      signal: context.signal,
      headers: getSessionHeaders(context.expectedSessionScope),
    },
  )
  return response.data
}
