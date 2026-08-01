export type FeatureRequestStatus = "pending" | "in_progress" | "completed";

export const FEATURE_REQUEST_STATUSES: FeatureRequestStatus[] = ["pending", "in_progress", "completed"];

export interface FeatureRequestResponse {
  id: number;
  content: string;
  status: FeatureRequestStatus;
  admin_reply: string | null;
  vote_count: number;
  has_voted: boolean;
  is_owner: boolean;
  created_at: Date;
  updated_at: Date;
  UserModel: {
    name: string;
    avatar: string;
  };
}

export interface ToggleFeatureRequestVoteResult {
  has_voted: boolean;
  vote_count: number;
}