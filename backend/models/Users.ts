import { DataTypes, InferAttributes, InferCreationAttributes, Model, Optional } from "sequelize";
import db from "./index";
import ReviewModel from "./Review";

interface UserCreationAttributes extends Optional<InferCreationAttributes<UserModel>, 'id' | 'uuid' | 'created_at' | 'updated_at'> { }

class UserModel extends Model<
  InferAttributes<UserModel>,
  UserCreationAttributes
> {
  declare id: number;
  declare uuid: string;
  declare google_sub: string;
  declare name?: string;
  declare detail?: string;
  declare avatar?: string;
  declare whitelist_id?: number | null;
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
      unique: true,
    },
    detail: {
      type: DataTypes.TEXT,
    },
    avatar: {
      type: DataTypes.STRING(255),
    },
    whitelist_id: {
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
    tableName: "Users",
    timestamps: true,
    createdAt: 'created_at',  // 映射到資料表中的 created_at
    updatedAt: 'updated_at',  // 映射到資料表中的 updated_at
  }
);



// UserModel.sync().catch((error) => {
//   console.log("User 模型同步失敗:", error)
// })

export default UserModel;
