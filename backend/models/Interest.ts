import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import db from ".";

class InterestModel extends Model<
  InferAttributes<InterestModel>,
  InferCreationAttributes<InterestModel>
> {
  declare id: number
  declare user_id: number
  declare course_id: number
  declare created_at: Date
}

InterestModel.init(

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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize: db.sequelize,
    tableName: "Interests",
    timestamps: true,
    createdAt: "created_at"
  }
);

InterestModel.sync().catch((error) => {
  console.error("Interest 模型同步失敗:", error);
});

export default InterestModel;