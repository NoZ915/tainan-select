import "dotenv/config";
import { createRequire } from "node:module";

interface DbConfig {
  [key: string]: {
    username: string;
    password: string;
    database: string;
    host: string;
    port: number;
    dialect: "mysql";
    pool?: {
      max?: number;
      min?: number;
      idle?: number;
      acquire?: number;
    };
  };
}

// API 與 sequelize-cli 共用設定，避免兩種啟動方式連到不同資料庫。
const config = createRequire(import.meta.url)("./config.cjs") as DbConfig;

export default config;
