import CourseModel from "../models/Course";
import ReviewModel from "../models/Review";

export interface CreateReviewInput {
  user_id: number;
  course_id: number;
  gain: number;
  sweetness: number;
  coolness: number;
  comment: string;
}

export interface ReviewsResponse {
  id: number,
  course_id: number;
  gain: number;
  sweetness: number;
  coolness: number;
  comment?: string;
  favorites: number;
  created_at: Date;
  updated_at: Date;
  UserModel: {
    name: string;
    avatar: string;
  },
  is_owner: boolean
}

export type LatestReviewsResponse = ReviewsResponse & {
  course: CourseModel
}

export type AllReviewsResponseByUser = ReviewsResponse & {
  course: CourseModel
}