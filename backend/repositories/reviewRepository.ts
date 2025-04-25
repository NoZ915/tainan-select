import CourseModel from "../models/Course";
import ReviewModel from "../models/Review";
import UserModel from "../models/Users";
import { CreateReviewInput, LatestReviewsResponse, ReviewsResponse } from "../types/review";

class ReviewRepository {
  async getAllReviewsByCourseId(
    course_id: number,
    user_id: number | undefined
  ): Promise<ReviewsResponse[]> {
    const reviews = await ReviewModel.findAll({
      where: { course_id },
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
      ],
    });

    // 目前使用者的評價優先顯示
    const sortedReviews = reviews.sort((a, b) => {
      if (a.user_id === user_id) return -1;
      if (b.user_id === user_id) return 1;
      return 0;
    });

    const reviewsWithOwnerFlag = sortedReviews.map((review) => {
      const is_owner = review.user_id === user_id;
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson; // 把user_id移除，不要回傳到前端
      return { ...reviewWithoutUserId, is_owner };
    });

    return reviewsWithOwnerFlag as ReviewsResponse[];
  }

  async upsertReview(input: CreateReviewInput): Promise<void> {
    const existingReview = await ReviewModel.findOne({
      where: { user_id: input.user_id, course_id: input.course_id },
    });

    if (existingReview) {
      await existingReview.update(input);
    } else {
      await ReviewModel.create(input);
    }
  }

  async deleteReview(review_id: number, user_id: number): Promise<void>{
    const review = await ReviewModel.findOne({
      where: {
        id: review_id,
        user_id
      }
    });
    if(review) await review?.destroy();
  }

  async getLatestReviews(user_id: number | undefined): Promise<LatestReviewsResponse[]>{
    const reviews = await ReviewModel.findAll({
      limit: 10,
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
        {
          model: CourseModel,
          as: 'course',
          attributes: ["id", "course_name", "department", "academy", "instructor", "instructor_url", "course_room", "course_time", "course_url", "credit_hours", "semester", "created_at", "updated_at", "course_type", "interests_count", "view_count"],
        },
      ],
    });

    const reviewsWithOwnerFlag = reviews.map((review) => {
      const is_owner = review.user_id === user_id;
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson; // 把user_id移除，不要回傳到前端
      return { ...reviewWithoutUserId, is_owner };
    });

    return reviewsWithOwnerFlag as LatestReviewsResponse[];
  }
}

export default new ReviewRepository();
