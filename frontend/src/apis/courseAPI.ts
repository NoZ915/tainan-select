import { CourseResponse, CourseSearchParams } from '../types/courseType';
import { axiosInstance } from './axiosInstance';

export const getCourses = async ({ page = 1, limit = 10, search }: {
    page?: number;
    limit?: number;
    search: CourseSearchParams;
}): Promise<CourseResponse> => {
    const filteredSearch = Object.fromEntries(
        Object.entries(search).filter(([, value]) => value !== "")
    );

    const response = await axiosInstance.get("/courses", {
        params: { page, limit, ...filteredSearch }
    });
    console.log(response.data)
    return response.data;
}