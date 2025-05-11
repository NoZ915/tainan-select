import { DataTypes, InferAttributes, InferCreationAttributes, Model, Optional } from "sequelize";
import db from ".";

interface CourseViewCreationAttributes extends Optional<InferCreationAttributes<CourseViewModel>, 'id' | 'user_id' | 'ip_address' | 'user_agent'> { }

class CourseViewModel extends Model<
	InferAttributes<CourseViewModel>,
	CourseViewCreationAttributes
>{
	declare id: number;
	declare course_id: number;
	declare user_id?: number;
	declare ip_address?: string;
	declare user_agent?:string;
	declare viewed_at?: Date;
}

CourseViewModel.init(
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    viewed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  },
  {
    sequelize: db.sequelize,
    tableName: "CourseViews",
    timestamps: true,
    createdAt: 'created_at',  // 映射到資料表中的 created_at
    updatedAt: 'updated_at',  // 映射到資料表中的 updated_at
  }
);

export default CourseViewModel;