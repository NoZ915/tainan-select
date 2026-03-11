import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Optional,
} from "sequelize";
import db from "./index";
import CourseModel from "./Course";

interface CourseRelatedPostCreationAttributes
  extends Optional<
    InferCreationAttributes<CourseRelatedPostModel>,
    | "id"
    | "excerpt"
    | "preview_title"
    | "preview_description"
    | "preview_image_url"
    | "preview_site_name"
    | "content"
    | "comments_json"
    | "matched_keywords"
    | "score"
    | "synced_at"
    | "created_at"
    | "updated_at"
  > {}

class CourseRelatedPostModel extends Model<
  InferAttributes<CourseRelatedPostModel>,
  CourseRelatedPostCreationAttributes
> {
  declare id: number;
  declare course_id: number;
  declare source: string;
  declare post_id: number;
  declare forum_alias: string;
  declare title: string;
  declare excerpt: string | null;
  declare preview_title: string | null;
  declare preview_description: string | null;
  declare preview_image_url: string | null;
  declare preview_site_name: string | null;
  declare content: string | null;
  declare comments_json: unknown[] | null;
  declare post_url: string;
  declare created_at_source: Date;
  declare matched_keywords: string[] | null;
  declare score: number;
  declare synced_at: Date;
  declare created_at: Date;
  declare updated_at: Date;
  declare course?: CourseModel;
}

CourseRelatedPostModel.init(
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
    source: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "dcard",
    },
    post_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    forum_alias: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: "nutn",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preview_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    preview_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    preview_image_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    preview_site_name: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    comments_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    post_url: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    created_at_source: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    matched_keywords: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    synced_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: "CourseRelatedPosts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

CourseRelatedPostModel.belongsTo(CourseModel, { foreignKey: "course_id", as: "course" });
CourseModel.hasMany(CourseRelatedPostModel, { foreignKey: "course_id", as: "relatedPosts" });

export default CourseRelatedPostModel;
