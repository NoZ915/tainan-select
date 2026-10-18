import { Sequelize } from "sequelize";
import config from "../config/config";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];
if (!dbConfig) {
  throw new Error("不支援的 NODE_ENV；請使用 development 或 production");
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

interface Db {
  Sequelize: typeof Sequelize;
  sequelize: Sequelize;
}

const db: Db = {
  Sequelize,
  sequelize,
};

export default db;
