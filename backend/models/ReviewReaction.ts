import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional
} from "sequelize";
import db from ".";
import ReviewModel from "./Review";
import UserModel from "./Users";
import ReactionPresetModel from "./ReactionPreset";

interface ReviewReactionCreationAttributes extends Optional<InferCreationAttributes<ReviewReactionModel>, "id" | "created_at"> { }

class ReviewReactionModel extends Model<
  InferAttributes<ReviewReactionModel>,
  ReviewReactionCreationAttributes
> {
  declare id: number;
  declare review_id: number;
  declare user_id: number;
  declare preset_id: number;
  declare created_at: Date;
}

ReviewReactionModel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    review_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    preset_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: "ReviewReactions",
    timestamps: false,
    createdAt: "created_at",
    updatedAt: false,
  }
);

ReviewReactionModel.belongsTo(ReviewModel, { foreignKey: "review_id" });
ReviewModel.hasMany(ReviewReactionModel, { foreignKey: "review_id" });

ReviewReactionModel.belongsTo(UserModel, { foreignKey: "user_id" });
UserModel.hasMany(ReviewReactionModel, { foreignKey: "user_id" });

ReviewReactionModel.belongsTo(ReactionPresetModel, { foreignKey: "preset_id", as: "preset" });
ReactionPresetModel.hasMany(ReviewReactionModel, { foreignKey: "preset_id" });

export default ReviewReactionModel;
