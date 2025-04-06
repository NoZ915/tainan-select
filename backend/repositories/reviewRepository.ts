import ReviewModel from "../models/Review";
import UserModel from "../models/Users";
import { CreateReviewInput, ReviewsResponse } from "../types/review";

class ReviewRepository{
    async getAllReviewsByCourseId(course_id: number, user_id: number | undefined): Promise<ReviewsResponse[]>{
        const reviews = await ReviewModel.findAll({
            where: { course_id },
            include: [
                {
                    model: UserModel,
                    attributes: ["name", "avatar"],
                },
            ],
        });

        const reviewsWithOwnerFlag = reviews.map((review) => {
            const is_owner = review.user_id === user_id;
            const reviewJson = review.toJSON();
            return { ...reviewJson, is_owner };
        })

        return reviewsWithOwnerFlag as ReviewsResponse[];
    }

    async createReview(input: CreateReviewInput): Promise<void>{
        await ReviewModel.create(input);
    }
}

export default new ReviewRepository();