import db from "../models";
import CourseRepository from "../repositories/courseRepository";
import InterestRepository from "../repositories/interestRepository";

class InterestService {
	async toggleInterest(user_id: number, course_id: number): Promise<void> {
		const transaction = await db.sequelize.transaction();

		try {
			const existingInterest = await InterestRepository.findInterest(user_id, course_id);
			if (existingInterest) {
				await InterestRepository.addInterest(user_id, course_id, transaction);
				await CourseRepository.incrementCount(course_id, "interests_count", transaction);
			} else {
				await InterestRepository.removeInterest(user_id, course_id, transaction);
				await CourseRepository.decrementCount(course_id, "interests_count", transaction);
			}

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	}
}

export default new InterestService();