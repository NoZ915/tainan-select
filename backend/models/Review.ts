import { DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import db from ".";

class ReviewModel extends Model<
  InferAttributes<ReviewModel>,
  InferCreationAttributes<ReviewModel>
> {
  declare id: number;
  declare user_id: number;
  declare course_id: number;
  declare gain: number;
  declare sweetness: number;
  declare coolness: number;
  declare comment?: string;
  declare favorites: number;
  declare created_at: Date;
  declare updated_at: Date;
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
    timestamps: false,
    tableName: "Reviews",
  }
)

ReviewModel.sync().catch((error) => {
  console.error("Review 模型同步失敗", error);
})

export default ReviewModel;