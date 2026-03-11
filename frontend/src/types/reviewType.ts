import { Course } from './courseType'
import { ReviewReactionSummary } from './reactionType'

export interface ReviewsResponse {
  id: number,
  user_id: number,
  course_id: number;
  gain: number;
  sweetness: number;
  coolness: number;
  comment?: string;
  favorites: number;
  comment_count: number;
  reactions: ReviewReactionSummary;
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
export type AllReviewsResponseByUser = ReviewsResponse & {
  course: Course
}

export interface ReviewsListResponse {
  items: AllReviewsResponseByUser[];
  count: number;
}

export interface UpsertReviewInput {
  course_id: number;
  gain: number;
  sweetness: number;
  coolness: number;
  comment: string;
}

export interface ReviewComment {
  id: number;
  review_id: number;
  content: string;
  created_at: Date;
  updated_at: Date;
  UserModel?: {
    name: string;
    avatar: string;
  };
  is_owner: boolean;
}
