import { Op } from "sequelize";
import UserModel from "../models/Users";

class UserRepository {
    async getUserById(id: number): Promise<UserModel | null> {
        return await UserModel.findByPk(id);
    }

    async getUserByGoogleSub(google_sub: string): Promise<UserModel | null> {
        return await UserModel.findOne({ where: { google_sub } });
    }

    async createUser(google_sub: string, name: string, whitelist_id: number | null = null) {
        return await UserModel.create({ google_sub, name, whitelist_id, is_admin: false });
    }

    async getUserByNameExceptId(name: string, user_id: number): Promise<UserModel | null> {
        return await UserModel.findOne({
            where: {
                name,
                id: { [Op.ne]: user_id },
            }
        });
    }

    async updateUser(
        user_id: number,
        updates: { name?: string; avatar?: string | null }
    ): Promise<UserModel | null> {
        const user = await UserModel.findOne({ where: { id: user_id } });
        if (!user) {
            return null;
        }
        await user.update(updates);
        return user;
    }

    async getAllUsersCount(): Promise<number> {
        return await UserModel.count();
    }
}

export default new UserRepository();
