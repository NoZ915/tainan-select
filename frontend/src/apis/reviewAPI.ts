import { UpsertReviewInput, ReviewsResponse, LatestReviewsResponse, ReviewsListResponse, ReviewComment } from '../types/reviewType'
import { ReviewReactionsResponse, ToggleReviewReactionResponse } from '../types/reactionType'
import { axiosInstance } from './axiosInstance'

export const getAllReviewsByCourseId = async (course_id: string): Promise<{ reviews: ReviewsResponse[], hasUserReviewedCourse: boolean }> => {
    const response = await axiosInstance.get(`/reviews/${course_id}`)
    return response.data
}

export const getAllReviewsByUserId = async ({ pageParam = 0 }): Promise<ReviewsListResponse> => {
    const limit = 10
    const response = await axiosInstance.get('/reviews/getAllReviewsByUserId', {
        params: { limit, offset: pageParam }
    })
    return response.data
}

export const upsertReview = async (input: UpsertReviewInput): Promise<void> => {
    const response = await axiosInstance.post('/reviews/upsertReview', input)
    return response.data
}

export const deleteReview = async (review_id: number): Promise<void> => {
    const response = await axiosInstance.delete(`/reviews/${review_id}`)
    return response.data
}

export const getLatestReviews = async (): Promise<LatestReviewsResponse[]> => {
    const response = await axiosInstance.get('/reviews/getLatestReviews')
    return response.data
}

export const getReviewReactions = async (review_id: number): Promise<ReviewReactionsResponse> => {
    const response = await axiosInstance.get(`/reviews/${review_id}/reactions`)
    return response.data
}

export const toggleReviewReaction = async (
    review_id: number,
    key: string
): Promise<ToggleReviewReactionResponse> => {
    const response = await axiosInstance.post(`/reviews/${review_id}/reactions/toggle`, { key })
    return response.data
}

export const getReviewComments = async (review_id: number): Promise<ReviewComment[]> => {
    const response = await axiosInstance.get(`/reviews/${review_id}/comments`)
    return response.data
}

export const createReviewComment = async (review_id: number, content: string): Promise<void> => {
    await axiosInstance.post(`/reviews/${review_id}/comments`, { content })
}

export const deleteReviewComment = async (review_id: number, comment_id: number): Promise<void> => {
    await axiosInstance.delete(`/reviews/${review_id}/comments/${comment_id}`)
}

export const updateReviewComment = async (review_id: number, comment_id: number, content: string): Promise<void> => {
    await axiosInstance.patch(`/reviews/${review_id}/comments/${comment_id}`, { content })
}
