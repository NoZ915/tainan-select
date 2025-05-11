import CourseViewRepository from "../repositories/courseViewRepository";

class CourseViewService {
  async shouldInsertView(
    course_id: number,
    user_id: number | undefined,
    ip_address: string | undefined,
    user_agent: string | undefined
  ): Promise<boolean> {
    const MAX_USER_AGENT_LENGTH = 255;
    const trimmedUserAgent = user_agent?.slice(0, MAX_USER_AGENT_LENGTH);
    return await CourseViewRepository.shouldInsertView(
      course_id,
      user_id,
      ip_address,
      trimmedUserAgent
    );
  }

  async insertCourseView(
    course_id: number,
    user_id: number | undefined,
    ip_address: string | undefined,
    user_agent: string | undefined
  ): Promise<void> {
		const MAX_USER_AGENT_LENGTH = 255;
    const trimmedUserAgent = user_agent?.slice(0, MAX_USER_AGENT_LENGTH);
    await CourseViewRepository.insertCourseView(
      course_id,
      user_id,
      ip_address,
      trimmedUserAgent
    );
  }
}

export default new CourseViewService();
