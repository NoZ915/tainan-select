import { UpsertReviewInput, ReviewsResponse, LatestReviewsResponse, AllReviewsResponseByUser } from "../types/reviewType";
import { axiosInstance } from "./axiosInstance";

export const getAllReviewsByCourseId = async (course_id: string): Promise<{ reviews: ReviewsResponse[], hasUserReviewedCourse: boolean }> => {
    const response = await axiosInstance.get(`/reviews/${course_id}`);
    return response.data;
}

export const getAllReviewsByUserId = async ({ pageParam = 0 }): Promise<AllReviewsResponseByUser[]> => {
    const limit = 10;
    const response = await axiosInstance.get(`/reviews/getAllReviewsByUserId`, {
        params: { limit, offset: pageParam }
    });
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

export const getLatestReviews = async (): Promise<LatestReviewsResponse[]> => {
    const response = await axiosInstance.get(`/reviews/getLatestReviews`);
    return response.data;
}