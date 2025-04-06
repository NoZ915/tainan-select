import { CreateReviewInput, ReviewsResponse } from "../types/reviewType";
import { axiosInstance } from "./axiosInstance";

export const getAllReviewsByCourseId = async(course_id: string): Promise<ReviewsResponse[]> => {
    const response = await axiosInstance.get(`/reviews/${course_id}`);
    return response.data;
}

export const createReview = async(input: CreateReviewInput): Promise<void> => {
    const response = await axiosInstance.post(`/reviews/createReview`, input);
    return response.data;
}