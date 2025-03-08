import { CourseResponse } from '../types/courseType';
import { axiosInstance } from './axiosInstance';

export const getCourses = async({ page = 1, limit = 10 }): Promise<CourseResponse> => {
    const response = await axiosInstance.get("/api/courses", {
        params: { page, limit }
    });
    return response.data;
}