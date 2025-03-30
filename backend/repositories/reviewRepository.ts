import ReviewModel from "../models/Review";
import UserModel from "../models/Users";

class ReviewRepository{
    async getAllReviewsByCourseId(course_id: number): Promise<ReviewModel[]>{
        return await ReviewModel.findAll({
            where: { course_id },
            include: [
                {
                    model: UserModel,
                    attributes: ["name", "avatar"],
                },
            ],
        });
    }
}

export default new ReviewRepository();