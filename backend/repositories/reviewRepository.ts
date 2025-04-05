import ReviewModel from "../models/Review";
import UserModel from "../models/Users";
import { CreateReviewInput } from "../types/review";

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

    async createReview(input: CreateReviewInput): Promise<void>{
        await ReviewModel.create(input);
    }
}

export default new ReviewRepository();