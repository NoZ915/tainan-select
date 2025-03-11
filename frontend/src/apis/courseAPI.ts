import { CourseResponse } from '../types/courseType';
import { axiosInstance } from './axiosInstance';

export const getCourses = async ({ page = 1, limit = 10, search = "" }): Promise<CourseResponse> => {
    const response = await axiosInstance.get("/courses", {
        params: { page, limit, search }
    });
    console.log(response.data)
    return response.data;
}