import ReviewModel from "../models/Review";

class ReviewRepository{
    async getAllReviewsByCourseId(course_id: number): Promise<ReviewModel[]>{
        return await ReviewModel.findAll({
            where: { course_id }
        });
    }
}

export default new ReviewRepository();