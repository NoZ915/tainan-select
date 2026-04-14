import whitelistRepository from "../repositories/whitelistRepository";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

class WhitelistService {
  async getWhitelistByEmail(email: string) {
    return await whitelistRepository.findByEmail(normalizeEmail(email));
  }

  async addWhitelistEmail(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const existing = await whitelistRepository.findByEmail(normalizedEmail);
    if (existing) {
      return {
        created: false,
        record: existing,
      };
    }

    const created = await whitelistRepository.create(
      normalizedEmail,
      `manual-${Date.now()}`,
      "管理員手動加入白名單"
    );
    return {
      created: true,
      record: created,
    };
  }
}

export default new WhitelistService();
