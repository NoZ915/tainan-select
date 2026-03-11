import RelatedPostImportModel from "../models/RelatedPostImport";
import UserModel from "../models/Users";

type CreateRelatedPostImportInput = {
  source_type: string;
  raw_payload: string;
  parsed_payload: unknown[] | Record<string, unknown> | null;
  import_result_summary: Record<string, unknown> | null;
  created_by: number | null;
};

class RelatedPostImportRepository {
  async create(input: CreateRelatedPostImportInput): Promise<RelatedPostImportModel> {
    return await RelatedPostImportModel.create(input);
  }

  async getRecent(limit = 10): Promise<RelatedPostImportModel[]> {
    return await RelatedPostImportModel.findAll({
      include: [
        {
          model: UserModel,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit,
    });
  }

  async getRecentPage(page: number, pageSize: number): Promise<{ rows: RelatedPostImportModel[]; count: number }> {
    return await RelatedPostImportModel.findAndCountAll({
      include: [
        {
          model: UserModel,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["created_at", "DESC"], ["id", "DESC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
  }

  async deleteById(id: number): Promise<number> {
    return await RelatedPostImportModel.destroy({
      where: { id },
    });
  }
}

export default new RelatedPostImportRepository();
