import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional
} from "sequelize";
import db from ".";

interface ReactionPresetCreationAttributes extends Optional<InferCreationAttributes<ReactionPresetModel>, "id" | "unicode" | "image_path" | "sort_order" | "is_active" | "created_at" | "updated_at"> { }

class ReactionPresetModel extends Model<
  InferAttributes<ReactionPresetModel>,
  ReactionPresetCreationAttributes
> {
  declare id: number;
  declare key: string;
  declare label: string;
  declare type: "unicode" | "image";
  declare unicode: string | null;
  declare image_path: string | null;
  declare sort_order: number;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

ReactionPresetModel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    label: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("unicode", "image"),
      allowNull: false,
    },
    unicode: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    image_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: "ReactionPresets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default ReactionPresetModel;
