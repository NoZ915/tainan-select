import db from "../models";
import CourseRepository from "../repositories/courseRepository";
import ReviewRepository from "../repositories/reviewRepository";
import { AllReviewsResponseByUser, CreateReviewInput, ReviewsResponse } from "../types/review";

class CourseService {
  async getAllReviewsByCourseId(
    course_id: number,
    user_id: number | undefined
  ): Promise<{ reviews: ReviewsResponse[]; hasUserReviewedCourse: boolean }> {
    let hasUserReviewedCourse = false;
    if (user_id !== undefined) {
      hasUserReviewedCourse = await ReviewRepository.hasUserReviewedCourse(
        course_id,
        user_id
      );
    }
    const reviews = await ReviewRepository.getAllReviewsByCourseId(
      course_id,
      user_id
    );
    return { reviews, hasUserReviewedCourse };
  }

  async getAllReviewsByUserId(user_id: number, limit: number, offset: number): Promise<AllReviewsResponseByUser[]> {
    return await ReviewRepository.getAllReviewsByUserId(user_id, limit, offset);
  }

  async upsertReview(input: CreateReviewInput): Promise<void> {
    await ReviewRepository.upsertReview(input);
  }

  // 一次動兩DB，所以加個transaction
  async deleteReview(review_id: number, user_id: number): Promise<void> {
    const transaction = await db.sequelize.transaction();

    try {
      const review = await ReviewRepository.getReviewById(
        review_id,
        user_id,
        transaction
      );
      await ReviewRepository.deleteReview(review_id, user_id, transaction);
      await CourseRepository.decrementCount(
        review.course_id,
        "review_count",
        transaction
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  async getLatestReviews(
    user_id: number | undefined
  ): Promise<ReviewsResponse[]> {
    return await ReviewRepository.getLatestReviews(user_id);
  }
}

export default new CourseService();
