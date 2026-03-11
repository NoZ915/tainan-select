import { Course, CourseDetailResponse, CourseResponse, SearchParams } from '../types/courseType'
import { axiosInstance } from './axiosInstance'

export const getCourses = async (searchParams: SearchParams): Promise<CourseResponse> => {
  const filteredSearchParams = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== ''
    })
  )
  const normalizedSearchParams = Object.fromEntries(
    Object.entries(filteredSearchParams).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])
  )
  const queryParams = new URLSearchParams({ ...normalizedSearchParams }).toString()
  const response = await axiosInstance.get(`/courses?${queryParams}`)
  return response.data
}

export const getCourse = async (course_id: string): Promise<CourseDetailResponse> => {
  const response = await axiosInstance.get(`/courses/${course_id}`)
  return response.data
}

export const getDepartments = async (): Promise<{ departments: string[] }> => {
  const response = await axiosInstance.get('/courses/getAllDepartments')
  return response.data
}

export const getAcademies = async (): Promise<{ academies: string[] }> => {
  const response = await axiosInstance.get('/courses/getAllAcademies')
  return response.data
}

// NOTE: 暫時移除此功能
export const getMostCuriousButUnreviewedCourses = async (): Promise<Course[]> => {
  const response = await axiosInstance.get('/courses/getMostCuriousButUnreviewedCourses')
  return response.data
}
