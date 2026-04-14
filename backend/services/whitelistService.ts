import whitelistRepository from "../repositories/whitelistRepository";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

class WhitelistService {
  async getWhitelistByEmail(email: string) {
    return await whitelistRepository.findByEmail(normalizeEmail(email));
  }

  async addWhitelistEmail(email: string, studentId?: string, note?: string | null) {
    const normalizedEmail = normalizeEmail(email);
    const [record, created] = await whitelistRepository.findOrCreateByEmail(
      normalizedEmail,
      studentId?.trim() || `manual-${Date.now()}`,
      note?.trim() || "管理員手動加入白名單"
    );
    return {
      created,
      record,
    };
  }
}

export default new WhitelistService();
