import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "sequelize";
import db from "./index";
import UserModel from "./Users";
import FeatureRequestModel from "./FeatureRequest";

class FeatureRequestVoteModel extends Model<
  InferAttributes<FeatureRequestVoteModel>,
  InferCreationAttributes<FeatureRequestVoteModel>
> {
  declare id: CreationOptional<number>;
  declare feature_request_id: number;
  declare user_id: number;
  declare created_at: CreationOptional<Date>;
}

FeatureRequestVoteModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    feature_request_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: "FeatureRequestVotes",
    timestamps: false,
    createdAt: "created_at",
    updatedAt: false,
  }
);

FeatureRequestVoteModel.belongsTo(UserModel, { foreignKey: "user_id" });
FeatureRequestVoteModel.belongsTo(FeatureRequestModel, { foreignKey: "feature_request_id" });
FeatureRequestModel.hasMany(FeatureRequestVoteModel, { foreignKey: "feature_request_id" });

export default FeatureRequestVoteModel;