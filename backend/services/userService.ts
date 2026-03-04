import userRepository from "../repositories/userRepository";
import StatsService from "./statsService";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";
import { isAvatarAvailable } from "../utils/avatarFiles";

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

    async updateUser(
        user_id: number,
        payload: { name?: string; avatar?: string | null }
    ): Promise<{ name: string; avatar: string | null }> {
        const { name, avatar } = payload;

        if (name !== undefined) {
            const existingUser = await userRepository.getUserByNameExceptId(name, user_id);
            if (existingUser) {
                throw new Error("NAME_ALREADY_EXISTS");
            }
        }

        if (avatar !== undefined && avatar !== null) {
            const available = await isAvatarAvailable(avatar);
            if (!available) {
                throw new Error("AVATAR_NOT_FOUND");
            }
        }

        const updates: { name?: string; avatar?: string | null } = {};
        if (name !== undefined) {
            updates.name = name;
        }
        if (avatar !== undefined) {
            updates.avatar = avatar;
        }

        const user = await userRepository.updateUser(user_id, updates);
        if (!user) {
            throw new Error("USER_NOT_FOUND");
        }

        return {
            name: user.name ?? "",
            avatar: user.avatar ?? null,
        };
    }
}

export default new UserService();
