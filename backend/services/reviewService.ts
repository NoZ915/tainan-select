import CourseRepository from "../repositories/courseRepository";
import ReviewRepository from "../repositories/reviewRepository";
import { CreateReviewInput, ReviewsResponse } from "../types/review";

class CourseService {
    async getAllReviewsByCourseId(course_id: number, user_id: number | undefined): Promise<ReviewsResponse[]> {
        return await ReviewRepository.getAllReviewsByCourseId(course_id, user_id);
    }

    async upsertReview(input: CreateReviewInput): Promise<void> {
        await ReviewRepository.upsertReview(input);
        await CourseRepository.IncrementCount(input.course_id, "review_count");
    }

    async deleteReview(review_id: number, user_id: number): Promise<void> {
        const review = await ReviewRepository.getReviewById(review_id, user_id);

        await ReviewRepository.deleteReview(review_id, user_id);
        await CourseRepository.decrementCount(review.course_id, "review_count");
    }

    async getLatestReviews(user_id: number | undefined): Promise<ReviewsResponse[]> {
        return await ReviewRepository.getLatestReviews(user_id);
    }
}

export default new CourseService();