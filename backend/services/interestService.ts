import db from "../models";
import CourseRepository from "../repositories/courseRepository";
import InterestRepository from "../repositories/interestRepository";

class InterestService {
    async addInterest(user_id: number, course_id: number): Promise<void> {
        const transaction = await db.sequelize.transaction();

        try{
            await InterestRepository.addInterest(user_id, course_id, transaction);
            await CourseRepository.IncrementCount(course_id, "interests_count", transaction);

            await transaction.commit();
        }catch(err){
            await transaction.rollback();
            throw err;
        }
    }
}

export default new InterestService();