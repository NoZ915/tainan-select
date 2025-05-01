import UserModel from "../models/Users";

class UserRepository {
    async getUserByGoogleSub(google_sub: string): Promise<UserModel | null> {
        return await UserModel.findOne({ where: { google_sub } });
    }

    async createUser(google_sub: string, name: string) {
        return await UserModel.create({ google_sub, name });
    }

    async updateUser(user_id: number, name: string): Promise<void> {
        const user = await UserModel.findOne({ where: { id: user_id } });
        await user?.update({ name });
    }
}

export default new UserRepository();