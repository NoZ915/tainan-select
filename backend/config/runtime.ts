export class ConfigurationError extends Error {}

export const readRuntimeConfig = (environment: NodeJS.ProcessEnv = process.env) => {
  if (environment.NODE_ENV && !["development", "production"].includes(environment.NODE_ENV)) {
    throw new ConfigurationError("不支援的 NODE_ENV；請使用 development 或 production");
  }
  const isProduction = environment.NODE_ENV === "production";
  const readUrl = (name: string, apiPath = false): string => {
    const value = environment[name];
    try {
      const url = new URL(value ?? "");
      if (!value || !["http:", "https:"].includes(url.protocol)
        || url.username || url.password || url.search || url.hash
        || (isProduction && url.protocol !== "https:")
        || (apiPath ? !["/api", "/api/"].includes(url.pathname) : url.pathname !== "/")) {
        throw new Error();
      }
      return apiPath ? `${url.origin}/api` : url.origin;
    } catch {
      throw new ConfigurationError(`${name} 必須為有效${isProduction ? "的 HTTPS" : "的 HTTP(S)"}網址${apiPath ? "，並包含 /api 路徑" : "來源，不可包含路徑"}`);
    }
  };
  const portValue = environment.PORT ?? "3000";
  const proxyValue = environment.TRUST_PROXY_HOPS ?? "0";
  const port = Number(portValue);
  const trustProxyHops = Number(proxyValue);
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigurationError("PORT 必須為 1 至 65535 的整數");
  }
  if (!/^\d+$/.test(proxyValue) || !Number.isSafeInteger(trustProxyHops)) {
    throw new ConfigurationError("TRUST_PROXY_HOPS 必須為非負整數");
  }
  const missingVariables = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "JWT_SECRET"]
    .filter((name) => !environment[name]?.trim());
  if (missingVariables.length > 0) {
    throw new ConfigurationError(`缺少必要環境變數：${missingVariables.join("、")}`);
  }
  return {
    port,
    trustProxyHops,
    frontendBaseUrl: readUrl("FRONTEND_BASE_URL"),
    backendBaseUrl: readUrl("BACKEND_BASE_URL", true),
  };
};

export type RuntimeConfig = ReturnType<typeof readRuntimeConfig>;
