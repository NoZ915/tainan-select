import { TIMETABLE_ANALYTICS_CONFIG } from "../types/timetableAnalytics";

export const REVIEW_REQUEST_CONFIG = {
  interestWeights: [
    { maxAgeDays: 30, weight: 5 },
    { maxAgeDays: 60, weight: 4 },
    { maxAgeDays: 90, weight: 3 },
    { maxAgeDays: 120, weight: 2 },
    { maxAgeDays: 180, weight: 1 },
  ],
  reviewNeedFactors: [
    { maxReviewCount: 0, factor: 1 },
    { maxReviewCount: 1, factor: 0.8 },
    { maxReviewCount: 2, factor: 0.6 },
    { maxReviewCount: 4, factor: 0.4 },
    { maxReviewCount: 7, factor: 0.2 },
  ],
  minimumReviewNeedFactor: 0.1,
  guestSnapshotTtlDays: TIMETABLE_ANALYTICS_CONFIG.guestSnapshotTtlDays,
  defaultLimit: 5,
  maxLimit: 20,
} as const;

export const getInterestWeightByAgeDays = (ageDays: number): number => {
  if (ageDays < 0) return REVIEW_REQUEST_CONFIG.interestWeights[0].weight;

  return REVIEW_REQUEST_CONFIG.interestWeights.find(
    ({ maxAgeDays }) => ageDays <= maxAgeDays
  )?.weight ?? 0;
};

export const getReviewNeedFactor = (reviewCount: number): number => (
  REVIEW_REQUEST_CONFIG.reviewNeedFactors.find(
    ({ maxReviewCount }) => reviewCount <= maxReviewCount
  )?.factor ?? REVIEW_REQUEST_CONFIG.minimumReviewNeedFactor
);
