import userRepository from "../repositories/userRepository";
import StatsService from "./statsService";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";

class UserService {
    async getUserByGoogleSub(google_sub: string) {
        return await userRepository.getUserByGoogleSub(google_sub);
    }

    async createUser(google_sub: string, whitelist_id: number | null = null) {
        const name = generateTainanCharacterName();
        const user = await userRepository.createUser(google_sub, name, whitelist_id);
        StatsService.clearCache();
        return user;
    }

    async updateUser(user_id: number, name: string): Promise<string> {
        const existingUser = await userRepository.getUserByNameExceptId(name, user_id);
        if (existingUser) {
            throw new Error("NAME_ALREADY_EXISTS");
        }
        await userRepository.updateUser(user_id, name);
        return name;
    }
}

export default new UserService();
