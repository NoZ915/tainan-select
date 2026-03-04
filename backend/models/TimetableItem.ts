import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Optional,
} from "sequelize";
import db from ".";
import TimetableModel from "./Timetable";
import CourseModel from "./Course";

interface TimetableItemCreationAttributes
  extends Optional<InferCreationAttributes<TimetableItemModel>, "id" | "created_at" | "updated_at"> { }

class TimetableItemModel extends Model<
  InferAttributes<TimetableItemModel>,
  TimetableItemCreationAttributes
> {
  declare id: number;
  declare timetable_id: number;
  declare course_id: number;
  declare created_at?: Date;
  declare updated_at?: Date;
}

TimetableItemModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    timetable_id: {
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
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db.sequelize,
    tableName: "TimetableItems",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

TimetableItemModel.belongsTo(TimetableModel, { foreignKey: "timetable_id", as: "timetable" });
TimetableModel.hasMany(TimetableItemModel, { foreignKey: "timetable_id", as: "items" });

TimetableItemModel.belongsTo(CourseModel, { foreignKey: "course_id", as: "course" });
CourseModel.hasMany(TimetableItemModel, { foreignKey: "course_id", as: "timetableItems" });

export default TimetableItemModel;
