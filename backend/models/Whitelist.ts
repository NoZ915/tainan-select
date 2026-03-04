import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import db from "./index";

class WhitelistModel extends Model<
  InferAttributes<WhitelistModel>,
  InferCreationAttributes<WhitelistModel>
> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare student_id: string;
  declare note?: string | null;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

WhitelistModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    student_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
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
    tableName: "Whitelists",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default WhitelistModel;
