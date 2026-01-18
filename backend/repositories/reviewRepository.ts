import e from "cors";
import CourseModel from "../models/Course";
import ReviewModel from "../models/Review";
import UserModel from "../models/Users";
import { AllReviewsResponseByUser, CreateReviewInput, LatestReviewsResponse, ReviewsResponse } from "../types/review";
import { Transaction } from "sequelize";
import CourseRepository from "./courseRepository";
import db from "../models";

class ReviewRepository {
  async getAllReviewsCount(): Promise<number> {
    return await ReviewModel.count();
  }

  async getAllReviewsByCourseId(
    course_id: number,
    user_id: number | undefined
  ): Promise<ReviewsResponse[]> {
    const reviews = await ReviewModel.findAll({
      where: { course_id },
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
      ],
    });
    // 目前使用者的評價優先顯示
    const ownerReviews = [];
    const otherReviews = [];
    for (const review of reviews) {
      if (review.user_id === user_id) {
        ownerReviews.push(review);
      } else {
        otherReviews.push(review);
      }
    }

    const reviewsWithOwnerFlag = [...ownerReviews, ...otherReviews].map((review) => {
      const is_owner = review.user_id === user_id;
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson; // 把user_id移除，不要回傳到前端
      return { ...reviewWithoutUserId, is_owner };
    });

    return reviewsWithOwnerFlag as ReviewsResponse[];
  }

  async getReviewById(review_id: number, user_id: number, transaction: Transaction): Promise<ReviewModel> {
    const review = await ReviewModel.findOne({
      where: {
        id: review_id,
        user_id
      },
      transaction
    });
    if (!review) throw new Error("Review not found");
    else return review;
  }

  async getAllReviewsByUserId(user_id: number, limit: number, offset: number): Promise<AllReviewsResponseByUser[]> {
    const reviews = await ReviewModel.findAll({
      where: { user_id },
      limit,
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
        {
          model: CourseModel,
          as: 'course',
          attributes: ["id", "course_name", "department", "academy", "instructor", "instructor_url", "course_room", "course_time", "course_url", "credit_hours", "semester", "created_at", "updated_at", "course_type", "interests_count", "view_count", "review_count"]
        }
      ]
    });

    const reviewsWithOwnerFlag = reviews.map((review) => {
      const is_owner = review.user_id === user_id;
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson; // 把user_id移除，不要回傳到前端
      return { ...reviewWithoutUserId, is_owner };
    });

    return reviewsWithOwnerFlag as unknown as AllReviewsResponseByUser[];
  }

  async upsertReview(input: CreateReviewInput): Promise<void> {
    const transaction = await db.sequelize.transaction();
    const existingReview = await ReviewModel.findOne({
      where: { user_id: input.user_id, course_id: input.course_id },
      transaction
    });

    if (existingReview) {
      await existingReview.update(input);
    } else {
      try {
        // 一次動兩DB，所以加個transaction
        await ReviewModel.create(input, { transaction });
        await CourseRepository.incrementCount(
          input.course_id,
          "review_count",
          transaction
        );

        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }

    }
  }

  async deleteReview(review_id: number, user_id: number, transaction: Transaction): Promise<void> {
    const review = await this.getReviewById(review_id, user_id, transaction);
    if (review) {
      await review?.destroy();
    }
  }

  async getLatestReviews(user_id: number | undefined): Promise<LatestReviewsResponse[]> {
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

  async hasUserReviewedCourse(course_id: number, user_id: number | undefined): Promise<boolean> {
    const review = await ReviewModel.findOne({
      where: { course_id, user_id }
    })
    return review !== null;
  }
}

export default new ReviewRepository();
