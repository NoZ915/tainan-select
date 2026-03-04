export interface ReactionPreset {
  key: string;
  label: string;
  type: 'unicode' | 'image';
  unicode: string | null;
  imagePath: string | null;
  sortOrder: number;
}

export interface ReviewReactionSummary {
  counts: Record<string, number>;
  myReactions: string[];
}

export interface ReviewReactionsResponse extends ReviewReactionSummary {
  reviewId: number;
}

export interface ToggleReviewReactionResponse {
  reviewId: number;
  key: string;
  action: 'added' | 'removed';
  counts: Record<string, number>;
}
