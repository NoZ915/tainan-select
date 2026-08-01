export type FeatureRequestStatus = 'pending' | 'in_progress' | 'completed'

export interface FeatureRequest {
  id: number;
  content: string;
  status: FeatureRequestStatus;
  admin_reply: string | null;
  vote_count: number;
  has_voted: boolean;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
  UserModel: {
    name: string;
    avatar: string;
  };
}

export interface ToggleFeatureRequestVoteResult {
  has_voted: boolean;
  vote_count: number;
}