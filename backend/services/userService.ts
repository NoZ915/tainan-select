import userRepository from "../repositories/userRepository";
import StatsService from "./statsService";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";

class UserService {
    async getUserByGoogleSub(google_sub: string) {
        return await userRepository.getUserByGoogleSub(google_sub);
    }

    async createUser(google_sub: string, whitelist_id: number | null = null) {
        const maxAttempts = 5;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            const name = generateTainanCharacterName();
            try {
                const user = await userRepository.createUser(google_sub, name, whitelist_id);
                StatsService.clearCache();
                return user;
            } catch (err: any) {
                if (err?.name === "SequelizeUniqueConstraintError") {
                    continue;
                }
                throw err;
            }
        }

        const baseName = generateTainanCharacterName();
        let index = 1;
        // Fall back to a deterministic suffix if random names keep colliding.
        while (true) {
            const nameWithIndex = `${baseName}${index}`;
            try {
                const user = await userRepository.createUser(google_sub, nameWithIndex, whitelist_id);
                StatsService.clearCache();
                return user;
            } catch (err: any) {
                if (err?.name === "SequelizeUniqueConstraintError") {
                    index += 1;
                    continue;
                }
                throw err;
            }
        }
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
