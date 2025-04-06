import { UpsertReviewInput, ReviewsResponse } from "../types/reviewType";
import { axiosInstance } from "./axiosInstance";

export const getAllReviewsByCourseId = async (course_id: string): Promise<ReviewsResponse[]> => {
    const response = await axiosInstance.get(`/reviews/${course_id}`);
    return response.data;
}

export const upsertReview = async (input: UpsertReviewInput): Promise<void> => {
    const response = await axiosInstance.post(`/reviews/upsertReview`, input);
    return response.data;
}

export const deleteReview = async (review_id: number): Promise<void> => {
    const response = await axiosInstance.delete(`/reviews/${review_id}`);
    return response.data;
}