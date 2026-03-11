import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional,
} from "sequelize";
import db from "./index";
import UserModel from "./Users";

interface RelatedPostImportCreationAttributes
  extends Optional<
    InferCreationAttributes<RelatedPostImportModel>,
    "id" | "parsed_payload" | "import_result_summary" | "created_by" | "created_at" | "updated_at"
  > {}

class RelatedPostImportModel extends Model<
  InferAttributes<RelatedPostImportModel>,
  RelatedPostImportCreationAttributes
> {
  declare id: number;
  declare source_type: string;
  declare raw_payload: string;
  declare parsed_payload: unknown[] | Record<string, unknown> | null;
  declare import_result_summary: Record<string, unknown> | null;
  declare created_by: number | null;
  declare created_at: Date;
  declare updated_at: Date;
  declare creator?: UserModel;
}

RelatedPostImportModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    source_type: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    raw_payload: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    parsed_payload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    import_result_summary: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: "RelatedPostImports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

RelatedPostImportModel.belongsTo(UserModel, { foreignKey: "created_by", as: "creator" });
UserModel.hasMany(RelatedPostImportModel, { foreignKey: "created_by", as: "relatedPostImports" });

export default RelatedPostImportModel;
