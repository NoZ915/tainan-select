import userRepository from "../repositories/userRepository";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";

class UserService {
    async getUserByGoogleSub(google_sub: string) {
        return await userRepository.getUserByGoogleSub(google_sub);
    }

    async createUser(google_sub: string) {
        const name = generateTainanCharacterName();
        return await userRepository.createUser(google_sub, name);
    }

    async updateUser(user_id: number, name: string): Promise<string> {
        await userRepository.updateUser(user_id, name);
        return name;
    }
}

export default new UserService();