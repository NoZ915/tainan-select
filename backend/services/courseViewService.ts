import CourseViewRepository from "../repositories/courseViewRepository";
import { normalizeAnalyticsClientId } from "../utils/analyticsClientId";

export type CourseViewTrackingInput = {
  courseId: number;
  userId?: number;
  clientId?: unknown;
};

class CourseViewService {
  async trackCourseView({ courseId, userId, clientId }: CourseViewTrackingInput): Promise<boolean> {
    const normalizedClientId = normalizeAnalyticsClientId(clientId);
    if (userId === undefined && !normalizedClientId) return false;

    const identity = userId !== undefined
      ? { courseId, userId, clientId: normalizedClientId }
      : { courseId, userId: null, clientId: normalizedClientId as string };
    if (await CourseViewRepository.hasRecentView(identity)) return false;

    await CourseViewRepository.insertCourseView(identity);
    return true;
  }
}

export default new CourseViewService();
