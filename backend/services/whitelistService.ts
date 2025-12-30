import whitelistRepository from "../repositories/whitelistRepository";

class WhitelistService {
  async getWhitelistByEmail(email: string) {
    return await whitelistRepository.findByEmail(email);
  }
}

export default new WhitelistService();