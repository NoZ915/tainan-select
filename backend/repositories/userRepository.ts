import UserModel from "../models/Users";

class UserRepository{
    async getUserByGoogleSub(google_sub: string){
        return await UserModel.findOne({ where: { google_sub } });
    }
    async createUser(google_sub: string, name: string){
        return await UserModel.create({ google_sub, name });
    }
}

export default new UserRepository();