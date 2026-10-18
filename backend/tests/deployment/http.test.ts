import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import type { Request, Response, NextFunction } from "express";
import { startHttpServer } from "../../utils/startHttpServer";

Object.assign(process.env, {
  NODE_ENV: "production", GOOGLE_CLIENT_ID: "test-client", GOOGLE_CLIENT_SECRET: "test-secret",
  JWT_SECRET: "test-jwt-secret", ALLOWED_EMAIL_DOMAIN: "example.com",
  FRONTEND_BASE_URL: "https://staging.example.com", BACKEND_BASE_URL: "https://api-staging.example.com/api",
  DB_HOST: "isolated-db.invalid", DB_PORT: "3306", DB_USERNAME: "test-user",
  DB_PASSWORD: "test-password", DB_NAME: "test-db",
});
const { createApp } = await import("../../app");
const { default: passport } = await import("passport");
const { OAuthStateStore } = await import("../../utils/oauthStateStore");
const { getAuthCookieOptions } = await import("../../utils/authCookie");
const config = {
  port: 3000, trustProxyHops: 1,
  frontendBaseUrl: process.env.FRONTEND_BASE_URL!, backendBaseUrl: process.env.BACKEND_BASE_URL!,
};

test("production HTTP：健康檢查、靜態頭貼、CORS、OAuth 與登出", async (t) => {
  const app = createApp(config);
  let databaseReady = false;
  const server = await startHttpServer(app, { authenticate: async () => { databaseReady = true; } }, 0);
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  assert.equal(databaseReady, true);
  assert.equal((server.address() as AddressInfo).address, "0.0.0.0");
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const health = await fetch(`${baseUrl}/health`, { headers: { Origin: config.frontendBaseUrl } });
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.equal(health.headers.get("cache-control"), "no-store");
  assert.equal(health.headers.get("access-control-allow-origin"), config.frontendBaseUrl);
  assert.equal(health.headers.get("access-control-allow-credentials"), "true");
  const foreignOrigin = await fetch(`${baseUrl}/health`, { headers: { Origin: "https://foreign.example.net" } });
  assert.notEqual(foreignOrigin.headers.get("access-control-allow-origin"), "https://foreign.example.net");
  assert.notEqual(foreignOrigin.headers.get("access-control-allow-origin"), "*");
  const preflight = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "OPTIONS", headers: {
      Origin: config.frontendBaseUrl, "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,x-expected-session-scope",
    },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get("access-control-allow-headers") ?? "", /x-expected-session-scope/);
  const avatar = await fetch(`${baseUrl}/avatars/1.png`);
  assert.equal(avatar.status, 200);
  assert.match(avatar.headers.get("content-type") ?? "", /image\/png/);
  assert.ok((await avatar.arrayBuffer()).byteLength > 0);
  assert.equal((await fetch(`${baseUrl}/avatars/missing.png`)).status, 404);

  const oauth = await fetch(`${baseUrl}/api/auth/google?owner=deployment-test-owner-123456`, { redirect: "manual" });
  assert.equal(oauth.status, 302);
  const googleUrl = new URL(oauth.headers.get("location")!);
  assert.equal(googleUrl.origin, "https://accounts.google.com");
  assert.equal(googleUrl.searchParams.get("redirect_uri"), `${config.backendBaseUrl}/auth/google/callback`);
  assert.equal(googleUrl.searchParams.get("prompt"), "select_account");
  const stateCookie = oauth.headers.get("set-cookie")!;
  assert.match(stateCookie, /HttpOnly/);
  assert.match(stateCookie, /Secure/);
  assert.match(stateCookie, /SameSite=Lax/);
  assert.match(stateCookie, /Path=\/api\/auth\/google\/callback/);

  // 模擬 Google 已驗證的身份；仍走實際 state 驗證、JWT 發送與重新導向。
  t.mock.method(passport, "authenticate", (_strategy: string, _options: unknown, callback: Function) =>
    (req: Request, _res: Response, _next: NextFunction) => {
      new OAuthStateStore().verify(req, String(req.query.state), (error, valid) => {
        assert.ok(valid);
        callback(error, { id: 1, uuid: "test-uuid", google_sub: "test-sub" });
      });
    });
  const callback = await fetch(`${baseUrl}/api/auth/google/callback?state=${googleUrl.searchParams.get("state")}`, {
    redirect: "manual", headers: { Cookie: stateCookie.split(";")[0] },
  });
  assert.equal(callback.status, 302);
  assert.equal(callback.headers.get("location"), `${config.frontendBaseUrl}/auth/google/callback`);
  const tokenCookie = callback.headers.getSetCookie().find((cookie) => cookie.startsWith("token="))!;
  assert.match(tokenCookie, /HttpOnly/);
  assert.match(tokenCookie, /Secure/);
  assert.match(tokenCookie, /SameSite=Lax/);
  assert.match(tokenCookie, /Max-Age=604800/);
  assert.ok(!tokenCookie.includes("Domain="));
  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST" });
  const logoutCookie = logout.headers.get("set-cookie")!;
  assert.match(logoutCookie, /token=;/);
  assert.match(logoutCookie, /Secure/);
  assert.match(logoutCookie, /SameSite=Lax/);
  assert.match(logoutCookie, /Expires=Thu, 01 Jan 1970/);
  assert.deepEqual(getAuthCookieOptions(), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
});

test("資料庫驗證失敗不開放 HTTP；連接埠佔用時啟動失敗", async (t) => {
  const app = createApp(config);
  const listenMock = t.mock.method(app, "listen");
  await assert.rejects(startHttpServer(app, { authenticate: async () => { throw new Error("測試連線失敗"); } }, 0));
  assert.equal(listenMock.mock.callCount(), 0);
  listenMock.mock.restore();
  const server = await startHttpServer(app, { authenticate: async () => {} }, 0);
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));
  await assert.rejects(startHttpServer(app, { authenticate: async () => {} }, (server.address() as AddressInfo).port), { code: "EADDRINUSE" });
});
