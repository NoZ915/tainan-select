require("dotenv").config();

class DatabaseConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "DatabaseConfigurationError";
  }
}

const getDatabasePort = (required = false) => {
  const value = process.env.DB_PORT;
  if ((!value && required) || (value && !/^\d+$/.test(value))) {
    throw new DatabaseConfigurationError("DB_PORT 必須為 1 至 65535 的整數");
  }
  const port = Number(value || "3306");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new DatabaseConfigurationError("DB_PORT 必須為 1 至 65535 的整數");
  }
  return port;
};

const pool = { max: 3, min: 0, idle: 10000, acquire: 30000 };

module.exports = {
  development: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "TainanSelect(STG)",
    host: process.env.DB_HOST || "localhost",
    port: getDatabasePort(),
    dialect: "mysql",
    pool,
  },
  get production() {
    const missingVariables = ["DB_USERNAME", "DB_PASSWORD", "DB_NAME", "DB_HOST", "DB_PORT"]
      .filter((name) => !process.env[name]?.trim());
    if (missingVariables.length > 0) {
      throw new DatabaseConfigurationError(`production 缺少必要環境變數：${missingVariables.join("、")}`);
    }
    return {
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: getDatabasePort(true),
      dialect: "mysql",
      pool,
    };
  },
};
