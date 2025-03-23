import UserModel from "../models/Users";

class UserRepository{
    async getUserByGoogleSub(google_sub: string){
        return await UserModel.findOne({ where: { google_sub } });
    }
    async createUser(google_sub: string){
        return await UserModel.create({ google_sub });
    }
}

export default new UserRepository();