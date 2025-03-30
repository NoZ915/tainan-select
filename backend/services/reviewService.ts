import ReviewModel from "../models/Review";
import ReviewRepository from "../repositories/reviewRepository";

class CourseService{
    async getAllReviewsByCourseId(course_id: number): Promise<ReviewModel[]>{
        return await ReviewRepository.getAllReviewsByCourseId(course_id);
    }
}

export default new CourseService();