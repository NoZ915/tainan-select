import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Optional,
} from "sequelize";
import db from ".";
import UserModel from "./Users";

interface TimetableCreationAttributes
  extends Optional<InferCreationAttributes<TimetableModel>, "id" | "created_at" | "updated_at"> { }

class TimetableModel extends Model<
  InferAttributes<TimetableModel>,
  TimetableCreationAttributes
> {
  declare id: number;
  declare user_id: number;
  declare semester: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

TimetableModel.init(
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
    semester: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
    tableName: "Timetables",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

TimetableModel.belongsTo(UserModel, { foreignKey: "user_id", as: "user" });
UserModel.hasMany(TimetableModel, { foreignKey: "user_id", as: "timetables" });

export default TimetableModel;
