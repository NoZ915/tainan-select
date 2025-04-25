import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import db from "./index";
import ReviewModel from "./Review";

class CourseModel extends Model<
  InferAttributes<CourseModel>,
  InferCreationAttributes<CourseModel>
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
  declare course_type: string;
  declare interests_count: number;
  declare view_count: number;
  declare review_count: number;
}

CourseModel.init(
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
    course_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    interests_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    review_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize: db.sequelize,
    tableName: "Courses",
    timestamps: true,
    createdAt: 'created_at',  // 映射到資料表中的 created_at
    updatedAt: 'updated_at',  // 映射到資料表中的 updated_at
  }
);

CourseModel.sync().catch((error) => {
  console.error("Course 模型同步失敗:", error);
});

export default CourseModel;