import UserModel from "../models/Users";

class UserRepository {
    async getUserByGoogleSub(google_sub: string): Promise<UserModel | null> {
        return await UserModel.findOne({ where: { google_sub } });
    }

    async createUser(google_sub: string, name: string, whitelist_id: number | null = null) {
        return await UserModel.create({ google_sub, name, whitelist_id });
    }

    async updateUser(user_id: number, name: string): Promise<string> {
        const user = await UserModel.findOne({ where: { id: user_id } });
        await user?.update({ name });
        return user?.name ?? "";
    }

    async getAllUsersCount(): Promise<number> {
        return await UserModel.count();
    }
}

export default new UserRepository();
