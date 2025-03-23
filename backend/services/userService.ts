import userRepository from "../repositories/userRepository";

class UserService{
    async getUserByGoogleSub(google_sub: string){
        return await userRepository.getUserByGoogleSub(google_sub);
    }

    async createUser(google_sub: string){
        return userRepository.createUser(google_sub);
    }
}

export default new UserService();