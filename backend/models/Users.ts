import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import db from "./index";

class UserModel extends Model<
  InferAttributes<UserModel>,
  InferCreationAttributes<UserModel>
> {
  declare id: number;
  declare uuid: string;
  declare google_sub: string;
  declare name?: string;
  declare detail?: string;
  declare avatar?: string;
  declare created_at: Date;
  declare updated_at: Date;
}

UserModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
    },
    google_sub: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
    },
    detail: {
      type: DataTypes.TEXT,
    },
    avatar: {
      type: DataTypes.STRING(255),
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
    timestamps: false,
    tableName: "Users",
  }
);

UserModel.sync().catch((error) => {
  console.log("User 模型同步失敗:", error)
})

export default UserModel;