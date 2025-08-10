import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Optional,
} from "sequelize";
import db from "./index";

interface CourseScheduleCreationAttributes
  extends Optional<InferCreationAttributes<CourseScheduleModel>, 'id' | 'created_at' | 'updated_at'> { }

class CourseScheduleModel extends Model<
  InferAttributes<CourseScheduleModel>,
  CourseScheduleCreationAttributes
> {
  declare id: number;
  declare course_id: number;
  declare day: number; // 1=星期一, 7=星期日
  declare start_period: string; // "1" ~ "G"
  declare span: number; // 節數
  declare created_at?: Date;
  declare updated_at?: Date;
}

CourseScheduleModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    day: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    start_period: {
      type: DataTypes.STRING(1),
      allowNull: false,
    },
    span: {
      type: DataTypes.TINYINT,
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
    tableName: "CourseSchedules",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

CourseScheduleModel.sync().catch((error) => {
  console.error("Course 模型同步失敗:", error);
});

export default CourseScheduleModel;