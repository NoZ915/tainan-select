import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import db from "./index";

class Course extends Model<
  InferAttributes<Course>,
  InferCreationAttributes<Course>
> {
  declare id: number;
  declare course_name: string;
  declare department: string;
  declare academy?: string;
  declare instructor: string;
  declare instructor_url?: string;
  declare course_room?: string;
  declare course_time?: string;
  declare course_url?: string;
  declare credit_hours: number;
  declare semester: string;
  declare created_at: Date;
  declare updated_at: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    course_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    academy: {
      type: DataTypes.STRING(100),
    },
    instructor: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    instructor_url: {
      type: DataTypes.STRING(255),
    },
    course_room: {
      type: DataTypes.STRING(50),
    },
    course_time: {
      type: DataTypes.STRING(100),
    },
    course_url: {
      type: DataTypes.STRING(255),
    },
    credit_hours: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    semester: {
      type: DataTypes.STRING(10),
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
    timestamps: false,
    tableName: "Courses",
  }
);

Course.sync().catch((error) => {
  console.error("Course 模型同步失敗:", error);
});

export default Course;