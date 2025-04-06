import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import db from ".";
import UserModel from "./Users";

// models/User.ts那裡是用"Optional"用法，這邊試著用"CreationOptional"看看
class ReviewModel extends Model<
  InferAttributes<ReviewModel>,
  InferCreationAttributes<ReviewModel>
> {
  declare id: CreationOptional<number>;
  declare user_id: number;
  declare course_id: number;
  declare gain: number;
  declare sweetness: number;
  declare coolness: number;
  declare comment?: string;
  declare favorites: CreationOptional<number>;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

ReviewModel.init(
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
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gain: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
    },
    sweetness: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
    },
    coolness: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
    },
    favorites: {
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
    tableName: "Reviews",
    timestamps: true,
    createdAt: 'created_at',  // 映射到資料表中的 created_at
    updatedAt: 'updated_at',  // 映射到資料表中的 updated_at
  }
)

ReviewModel.belongsTo(UserModel, { foreignKey: "user_id" });
UserModel.hasMany(ReviewModel, { foreignKey: "user_id" });

ReviewModel.sync().catch((error) => {
  console.error("Review 模型同步失敗", error);
})

export default ReviewModel;