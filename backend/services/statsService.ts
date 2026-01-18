import CourseRepository from "../repositories/courseRepository";
import ReviewRepository from "../repositories/reviewRepository";
import UserRepository from "../repositories/userRepository";

class StatsService {
  private cache: {
    data: { courseCount: number; commentCount: number; userCount: number };
    expiresAt: number;
  } | null = null;
  private readonly cacheTtlMs = 60 * 1000;

  async getPlatformStats(): Promise<{
    courseCount: number;
    commentCount: number;
    userCount: number;
  }> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.data;
    }

    const [courseCount, commentCount, userCount] = await Promise.all([
      CourseRepository.getAllCoursesCount(),
      ReviewRepository.getAllReviewsCount(),
      UserRepository.getAllUsersCount(),
    ]);

    const data = {
      courseCount,
      commentCount,
      userCount,
    };

    this.cache = {
      data,
      expiresAt: now + this.cacheTtlMs,
    };

    return data;
  }
}

export default new StatsService();
