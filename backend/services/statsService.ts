import CourseRepository from "../repositories/courseRepository";
import ReviewRepository from "../repositories/reviewRepository";
import UserRepository from "../repositories/userRepository";

class StatsService {
  async getPlatformStats(): Promise<{
    courseCount: number;
    reviewCount: number;
    userCount: number;
  }> {
    const [courseCount, reviewCount, userCount] = await Promise.all([
      CourseRepository.getAllCoursesCount(),
      ReviewRepository.getAllReviewsCount(),
      UserRepository.getAllUsersCount(),
    ]);

    return {
      courseCount,
      reviewCount,
      userCount,
    };
  }
}

export default new StatsService();
