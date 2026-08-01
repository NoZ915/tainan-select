import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "./index";
import UserModel from "./Users";

export type FeatureRequestStatus = "pending" | "in_progress" | "completed";

class FeatureRequestModel extends Model<
  InferAttributes<FeatureRequestModel>,
  InferCreationAttributes<FeatureRequestModel>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare content: string;
  declare status: CreationOptional<FeatureRequestStatus>;
  declare admin_reply: CreationOptional<string | null>;
  declare vote_count: CreationOptional<number>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

FeatureRequestModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed"),
      allowNull: false,
      defaultValue: "pending",
    },
    admin_reply: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vote_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "FeatureRequests",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

FeatureRequestModel.belongsTo(UserModel, { foreignKey: "user_id" });
UserModel.hasMany(FeatureRequestModel, { foreignKey: "user_id" });

export default FeatureRequestModel;
