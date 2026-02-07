import "dotenv/config";

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

const config: DbConfig = {
  development: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "TainanSelect(STG)",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    dialect: "mysql",
    pool: {
      max: 3,
      min: 0,
      idle: 10000,
      acquire: 30000,
    },
  },
};

export default config;
