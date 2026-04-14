import WhitelistModel from "../models/Whitelist";

class WhitelistRepository {
  async findByEmail(email: string) {
    return await WhitelistModel.findOne({ where: { email } });
  }

  async create(email: string, student_id: string, note?: string | null) {
    return await WhitelistModel.create({
      email,
      student_id,
      note: note ?? null,
    });
  }
}

export default new WhitelistRepository();
