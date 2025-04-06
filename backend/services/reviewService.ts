import ReviewModel from "../models/Review";
import ReviewRepository from "../repositories/reviewRepository";
import { CreateReviewInput, ReviewsResponse } from "../types/review";

class CourseService{
    async getAllReviewsByCourseId(course_id: number, user_id: number | undefined): Promise<ReviewsResponse[]>{
        return await ReviewRepository.getAllReviewsByCourseId(course_id, user_id);
    }

    async upsertReview(input: CreateReviewInput): Promise<void>{
        await ReviewRepository.upsertReview(input);
    }
}

export default new CourseService();