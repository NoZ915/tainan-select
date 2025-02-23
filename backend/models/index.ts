import { Sequelize } from "sequelize";
import config from "../config/config";
import Course from "./Course";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

interface Db {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
  Course: typeof Course;
}

const db: Db = {
  Sequelize,
  sequelize,
  Course,
};

const startModels = async (): Promise<void> => {
  try {
    await Course.sync();
  } catch (error) {
    console.error("models 同步失敗:", error);
  }
};

startModels();

export default db;