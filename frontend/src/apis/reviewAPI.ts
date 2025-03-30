import { Review } from "../types/reviewType";
import { axiosInstance } from "./axiosInstance";

export const getAllReviewsByCourseId = async(course_id: string): Promise<Review[]> => {
    const response = await axiosInstance.get(`/reviews/${course_id}`);
    return response.data;
}