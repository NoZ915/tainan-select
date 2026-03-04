import WhitelistModel from "../models/Whitelist";

class WhitelistRepository {
  async findByEmail(email: string) {
    return await WhitelistModel.findOne({ where: { email } });
  }
}

export default new WhitelistRepository();