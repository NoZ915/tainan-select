import { Course, CourseDetailResponse, CourseOptionFilters, CourseResponse, SearchParams } from '../types/courseType'
import { axiosInstance } from './axiosInstance'
import { getOrCreateAnalyticsClientId } from '../utils/analyticsClientId'

export const getCourses = async (searchParams: SearchParams): Promise<CourseResponse> => {
  const filteredSearchParams = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      return value !== '' && value !== undefined
    })
  )
  const normalizedSearchParams = Object.fromEntries(
    Object.entries(filteredSearchParams).map(([key, value]) => [key, Array.isArray(value) ? value.join(',') : String(value)])
  )
  const queryParams = new URLSearchParams({ ...normalizedSearchParams }).toString()
  const response = await axiosInstance.get(`/courses?${queryParams}`)
  return response.data
}

type GetCourseOptions = {
  isAuthenticated: boolean;
  getClientId?: () => Promise<string>;
  onTrackingError?: (error: unknown) => void;
}

export const getCourse = async (
  course_id: string,
  {
    isAuthenticated,
    getClientId = getOrCreateAnalyticsClientId,
    onTrackingError = (error) => console.error('無法建立匿名課程瀏覽識別碼', error),
  }: GetCourseOptions,
): Promise<CourseDetailResponse> => {
  let clientId: string | undefined
  if (!isAuthenticated) {
    try {
      clientId = await getClientId()
    } catch (error) {
      onTrackingError(error)
    }
  }

  const response = await axiosInstance.get(`/courses/${course_id}`, {
    headers: clientId ? { 'X-Analytics-Client-Id': clientId } : undefined,
  })
  return response.data
}

export const getDepartments = async (filters: CourseOptionFilters = {}): Promise<{ departments: string[] }> => {
  const response = await axiosInstance.get('/courses/getAllDepartments', { params: filters })
  return response.data
}

export const getAcademies = async (filters: CourseOptionFilters = {}): Promise<{ academies: string[] }> => {
  const response = await axiosInstance.get('/courses/getAllAcademies', { params: filters })
  return response.data
}

// NOTE: 暫時移除此功能
export const getMostCuriousButUnreviewedCourses = async (): Promise<Course[]> => {
  const response = await axiosInstance.get('/courses/getMostCuriousButUnreviewedCourses')
  return response.data
}
