import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readRuntimeConfig } from "../../config/runtime";

const backendDirectory = fileURLToPath(new URL("../../", import.meta.url));
const environment = {
  NODE_ENV: "production",
  PORT: "3000",
  TRUST_PROXY_HOPS: "1",
  FRONTEND_BASE_URL: "https://staging.example.com/",
  BACKEND_BASE_URL: "https://api-staging.example.com/api/",
  GOOGLE_CLIENT_ID: "測試識別碼",
  GOOGLE_CLIENT_SECRET: "測試密鑰",
  ALLOWED_EMAIL_DOMAIN: "example.com",
  JWT_SECRET: "測試簽章",
  DB_HOST: "isolated-db.invalid",
  DB_PORT: "3306",
  DB_USERNAME: "isolated-user",
  DB_PASSWORD: "測試資料庫密碼",
  DB_NAME: "isolated-db",
  DOTENV_CONFIG_PATH: "/dev/null",
};

test("production 網址正規化並保留 API callback 路徑", () => {
  assert.deepEqual(readRuntimeConfig(environment), {
    port: 3000,
    trustProxyHops: 1,
    frontendBaseUrl: "https://staging.example.com",
    backendBaseUrl: "https://api-staging.example.com/api",
  });
});

test("拒絕萬用來源、不完整 callback、非 HTTPS、無效端口與代理設定", () => {
  for (const [name, value] of [
    ["FRONTEND_BASE_URL", "*"],
    ["FRONTEND_BASE_URL", "https://staging.example.com/path"],
    ["FRONTEND_BASE_URL", "http://staging.example.com"],
    ["BACKEND_BASE_URL", "https://api-staging.example.com"],
    ["BACKEND_BASE_URL", "https://user:secret@api-staging.example.com/api"],
    ["PORT", "3000abc"], ["PORT", "0"], ["PORT", "65536"],
    ["TRUST_PROXY_HOPS", "1abc"], ["TRUST_PROXY_HOPS", "-1"],
    ["JWT_SECRET", ""], ["NODE_ENV", "staging"],
  ]) {
    assert.throws(() => readRuntimeConfig({ ...environment, [name]: value }), new RegExp(name));
  }
  assert.equal(readRuntimeConfig({
    ...environment, NODE_ENV: "development",
    FRONTEND_BASE_URL: "http://localhost:5173", BACKEND_BASE_URL: "http://localhost:3000/api",
  }).frontendBaseUrl, "http://localhost:5173");
  assert.doesNotThrow(() => readRuntimeConfig({ ...environment, ALLOWED_EMAIL_DOMAIN: "" }));
});

test("API 與 sequelize-cli 的 production DB 設定一致，且不改用開發預設值", () => {
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", `
    import assert from "node:assert/strict";
    import config from "./config/config.ts";
    import { createRequire } from "node:module";
    const cliConfig = createRequire(import.meta.url)("./config/config.cjs");
    assert.deepEqual(config.production, cliConfig.production);
    assert.equal(config.production.host, "isolated-db.invalid");
    assert.equal(config.production.port, 3306);
    const { default: db } = await import("./models/index.ts");
    assert.equal(db.sequelize.config.database, "isolated-db");
    await db.sequelize.close();
  `], { cwd: backendDirectory, env: { ...process.env, ...environment }, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("production DB 必填值缺漏或無效連接埠會在 API 與 CLI 取設定時失敗", () => {
  for (const name of ["DB_HOST", "DB_NAME", "DB_USERNAME", "DB_PASSWORD", "DB_PORT"]) {
    for (const nodeEnvironment of ["production", "development"]) {
      const result = spawnSync(process.execPath, ["-e", 'require("./config/config.cjs").production'], {
        cwd: backendDirectory,
        env: { ...process.env, ...environment, NODE_ENV: nodeEnvironment, [name]: "" },
        encoding: "utf8",
      });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, new RegExp(name));
      assert.ok(!result.stderr.includes(environment.DB_PASSWORD));
    }
  }
  for (const value of ["3306abc", "-1", "65536"]) {
    const result = spawnSync(process.execPath, ["-e", 'require("./config/config.cjs").production'], {
      cwd: backendDirectory, env: { ...process.env, ...environment, DB_PORT: value }, encoding: "utf8",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /DB_PORT/);
  }
});

test("實際啟動入口在設定缺漏時以非零狀態結束，且不洩漏值", () => {
  for (const name of ["DB_HOST", "JWT_SECRET", "FRONTEND_BASE_URL"]) {
    const result = spawnSync(process.execPath, ["--import", "tsx", "server.ts"], {
      cwd: backendDirectory, env: { ...process.env, ...environment, [name]: "" }, encoding: "utf8", timeout: 10000,
    });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stderr, new RegExp(name));
    assert.ok(!result.stderr.includes(environment.DB_PASSWORD));
    assert.ok(!result.stderr.includes(environment.GOOGLE_CLIENT_SECRET));
  }
});

test("sequelize-cli 明確選擇 production 時，缺少 DB 變數會在連線前失敗", () => {
  const result = spawnSync(process.execPath, [
    "node_modules/sequelize-cli/lib/sequelize", "db:migrate:status",
    "--config", "config/config.cjs", "--env", "production",
  ], {
    cwd: backendDirectory,
    env: { ...process.env, ...environment, NODE_ENV: "development", DB_HOST: "" },
    encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /DB_HOST/);
  assert.ok(!result.stderr.includes(environment.DB_PASSWORD));
});

test("實際啟動入口在 DB 驗證失敗時非零退出，且隱藏原始連線資訊", () => {
  const modelsUrl = new URL("../../models/index.ts", import.meta.url).href;
  const preload = `import db from ${JSON.stringify(modelsUrl)};
    db.sequelize.authenticate = async () => { throw new Error("測試敏感連線資訊"); };
    db.sequelize.close = async () => {};`;
  const result = spawnSync(process.execPath, [
    "--import", "tsx", "--import", `data:text/javascript,${encodeURIComponent(preload)}`, "server.ts",
  ], {
    cwd: backendDirectory, env: { ...process.env, ...environment }, encoding: "utf8", timeout: 10000,
  });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /伺服器啟動失敗/);
  assert.ok(!result.stderr.includes("測試敏感連線資訊"));
});
