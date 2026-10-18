import "dotenv/config";
import { ConfigurationError, readRuntimeConfig } from "./config/runtime";
import { startHttpServer } from "./utils/startHttpServer";

const startServer = async (): Promise<void> => {
  const config = readRuntimeConfig();
  // 先驗證環境設定，再載入 OAuth 與資料庫模型。
  process.env.FRONTEND_BASE_URL = config.frontendBaseUrl;
  process.env.BACKEND_BASE_URL = config.backendBaseUrl;
  const { default: db } = await import("./models/index");
  try {
    const { createApp } = await import("./app");
    await startHttpServer(createApp(config), db.sequelize, config.port);
    console.log(`伺服器已啟動，監聽連接埠 ${config.port}`);
  } catch (error) {
    await db.sequelize.close().catch(() => {});
    throw error;
  }
};

startServer().catch((error: unknown) => {
  if (error instanceof ConfigurationError
    || (error instanceof Error && error.name === "DatabaseConfigurationError")) {
    console.error(error.message);
  }
  // 不輸出原始錯誤，避免連線資訊或憑證進入平台日誌。
  console.error("伺服器啟動失敗，請檢查環境變數、資料庫連線與連接埠設定。");
  process.exitCode = 1;
});
