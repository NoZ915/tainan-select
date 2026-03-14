import { Transaction } from "sequelize";
import db from "../models";
import CourseModel from "../models/Course";
import ReviewModel from "../models/Review";
import UserModel from "../models/Users";
import { AllReviewsResponseByUser, CreateReviewInput, LatestReviewsResponse, ReviewsResponse } from "../types/review";
import CourseRepository from "./courseRepository";
import ReviewReactionRepository from "./reviewReactionRepository";
import ReviewCommentRepository from "./reviewCommentRepository";

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
    const reactionSummaryMap = await ReviewReactionRepository.getReactionSummaryByReviewIds(
      reviews.map((review) => review.id),
      user_id
    );
    const commentCountMap = await ReviewCommentRepository.getCommentCountByReviewIds(
      reviews.map((review) => review.id)
    );

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
      const reactions = reactionSummaryMap.get(review.id) || { counts: {}, myReactions: [] };
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson;
      return {
        ...reviewWithoutUserId,
        is_owner,
        reactions,
        comment_count: commentCountMap.get(review.id) ?? 0,
      };
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

  async getReviewByIdForReaction(review_id: number, transaction: Transaction): Promise<ReviewModel> {
    const review = await ReviewModel.findByPk(review_id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!review) throw new Error("Review not found");
    return review;
  }

  async ensureReviewExists(review_id: number): Promise<void> {
    const review = await ReviewModel.findByPk(review_id, { attributes: ["id"] });
    if (!review) throw new Error("Review not found");
  }

  async getAllReviewsByUserId(user_id: number, limit: number, offset: number): Promise<AllReviewsResponseByUser[]> {
    const reviews = await ReviewModel.findAll({
      where: { user_id },
      limit,
      offset,
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "department", "academy", "instructor", "instructor_url", "course_room", "course_time", "course_url", "credit_hours", "semester", "created_at", "updated_at", "course_type", "interests_count", "view_count", "review_count", "dcard_related_post_count"],
        }
      ]
    });
    const reactionSummaryMap = await ReviewReactionRepository.getReactionSummaryByReviewIds(
      reviews.map((review) => review.id),
      user_id
    );
    const commentCountMap = await ReviewCommentRepository.getCommentCountByReviewIds(
      reviews.map((review) => review.id)
    );

    const reviewsWithOwnerFlag = reviews.map((review) => {
      const is_owner = review.user_id === user_id;
      const reactions = reactionSummaryMap.get(review.id) || { counts: {}, myReactions: [] };
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson;
      return {
        ...reviewWithoutUserId,
        is_owner,
        reactions,
        comment_count: commentCountMap.get(review.id) ?? 0,
      };
    });

    return reviewsWithOwnerFlag as unknown as AllReviewsResponseByUser[];
  }

  async getAllReviewsCountByUserId(user_id: number): Promise<number> {
    return await ReviewModel.count({
      where: { user_id }
    });
  }

  async upsertReview(input: CreateReviewInput): Promise<void> {
    const transaction = await db.sequelize.transaction();
    const existingReview = await ReviewModel.findOne({
      where: { user_id: input.user_id, course_id: input.course_id },
      transaction
    });

    if (existingReview) {
      await existingReview.update(input);
      return;
    }

    try {
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

  async deleteReview(review_id: number, user_id: number, transaction: Transaction): Promise<void> {
    const review = await this.getReviewById(review_id, user_id, transaction);
    if (review) {
      await review.destroy();
    }
  }

  async getLatestReviews(user_id: number | undefined): Promise<LatestReviewsResponse[]> {
    const reviews = await ReviewModel.findAll({
      limit: 10,
      order: [["updated_at", "DESC"]],
      include: [
        {
          model: UserModel,
          attributes: ["name", "avatar"],
        },
        {
          model: CourseModel,
          as: "course",
          attributes: ["id", "course_name", "department", "academy", "instructor", "instructor_url", "course_room", "course_time", "course_url", "credit_hours", "semester", "created_at", "updated_at", "course_type", "interests_count", "view_count"],
        },
      ],
    });
    const reactionSummaryMap = await ReviewReactionRepository.getReactionSummaryByReviewIds(
      reviews.map((review) => review.id),
      user_id
    );
    const commentCountMap = await ReviewCommentRepository.getCommentCountByReviewIds(
      reviews.map((review) => review.id)
    );

    const reviewsWithOwnerFlag = reviews.map((review) => {
      const reviewJson = review.toJSON();
      const { user_id: userId, ...reviewWithoutUserId } = reviewJson;
      const is_owner = review.user_id === user_id;
      const reactions = reactionSummaryMap.get(review.id) || { counts: {}, myReactions: [] };
      return { ...reviewWithoutUserId, is_owner, reactions };
    });
    const withCommentCount = reviewsWithOwnerFlag.map((review) => ({
      ...review,
      comment_count: commentCountMap.get(review.id) ?? 0,
    }));

    return withCommentCount as LatestReviewsResponse[];
  }

  async hasUserReviewedCourse(course_id: number, user_id: number | undefined): Promise<boolean> {
    const review = await ReviewModel.findOne({
      where: { course_id, user_id }
    });
    return review !== null;
  }

}

export default new ReviewRepository();
