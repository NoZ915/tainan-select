import whitelistRepository from "../repositories/whitelistRepository";
import { UniqueConstraintError } from "sequelize";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

class WhitelistService {
  async getWhitelistByEmail(email: string) {
    return await whitelistRepository.findByEmail(normalizeEmail(email));
  }

  async addWhitelistEmail(email: string, studentId?: string, note?: string | null) {
    const normalizedEmail = normalizeEmail(email);
    let record;
    let created;

    try {
      [record, created] = await whitelistRepository.findOrCreateByEmail(
        normalizedEmail,
        studentId?.trim() || `manual-${Date.now()}`,
        note?.trim() || "管理員手動加入白名單"
      );
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }

      const existing = await whitelistRepository.findByEmail(normalizedEmail);
      if (!existing) {
        throw error;
      }

      record = existing;
      created = false;
    }

    return {
      created,
      record,
    };
  }
}

export default new WhitelistService();
