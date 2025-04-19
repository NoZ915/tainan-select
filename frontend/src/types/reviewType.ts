import { Course } from "./courseType";

export interface ReviewsResponse {
  id: number,
  user_id: number,
  course_id: number;
  gain: number;
  sweetness: number;
  coolness: number;
  comment ?: string;
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
  course: Course
}

export interface UpsertReviewInput {
  course_id: number;
  gain: number;
  sweetness: number;
  coolness: number;
  comment: string;
}
