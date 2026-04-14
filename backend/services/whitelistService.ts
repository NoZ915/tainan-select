import whitelistRepository from "../repositories/whitelistRepository";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

class WhitelistService {
  async getWhitelistByEmail(email: string) {
    return await whitelistRepository.findByEmail(normalizeEmail(email));
  }

  async addWhitelistEmail(email: string, studentId?: string, note?: string | null) {
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
      studentId?.trim() || `manual-${Date.now()}`,
      note?.trim() || "管理員手動加入白名單"
    );
    return {
      created: true,
      record: created,
    };
  }
}

export default new WhitelistService();
