import db from "../models";
import CourseRepository from "../repositories/courseRepository";
import InterestRepository from "../repositories/interestRepository";
import { Interest } from "../types/interest";

interface ToggleInterestResult {
	isInterest: boolean,
	message: string
}

class InterestService {
	async toggleInterest(user_id: number, course_id: number): Promise<ToggleInterestResult> {
		const transaction = await db.sequelize.transaction();

		try {
			let result: ToggleInterestResult;
			const existingInterest = await InterestRepository.findInterest(user_id, course_id);
			if (existingInterest) {
				await InterestRepository.removeInterest(user_id, course_id, transaction);
				await CourseRepository.decrementCount(course_id, "interests_count", transaction);
				result = {
					isInterest: false,
					message: "已移除收藏"
				}

			} else {
				await InterestRepository.addInterest(user_id, course_id, transaction);
				await CourseRepository.incrementCount(course_id, "interests_count", transaction);
				result = {
					isInterest: true,
					message: "已加入收藏"
				}
			}

			await transaction.commit();
			return result;
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	}

	async getAllInterests(user_id: number): Promise<Interest[]>{
		return await InterestRepository.getAllInterests(user_id);
	}
}

export default new InterestService();