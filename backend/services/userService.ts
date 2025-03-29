import userRepository from "../repositories/userRepository";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";

class UserService{
    async getUserByGoogleSub(google_sub: string){
        return await userRepository.getUserByGoogleSub(google_sub);
    }

    async createUser(google_sub: string){
        const name = generateTainanCharacterName();
        return userRepository.createUser(google_sub, name);
    }
}

export default new UserService();