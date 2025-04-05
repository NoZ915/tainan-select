import ReviewModel from "../models/Review";
import ReviewRepository from "../repositories/reviewRepository";
import { CreateReviewInput } from "../types/review";

class CourseService{
    async getAllReviewsByCourseId(course_id: number): Promise<ReviewModel[]>{
        return await ReviewRepository.getAllReviewsByCourseId(course_id);
    }

    async createReview(input: CreateReviewInput): Promise<void>{
        await ReviewRepository.createReview(input);
    }
}

export default new CourseService();