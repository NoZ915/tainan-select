import axios from "axios";
import https from "https";

// 處理爬蟲被擋的問題
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
});

export const detailClient = axios.create({
  httpsAgent,
  timeout: 15_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryableNetworkError(err: any) {
  const code = err?.code;
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNABORTED" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND"
  );
}

export async function getWithRetry(url: string, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await detailClient.get(url, {
        headers: { Referer: "https://ecourse.nutn.edu.tw/public/tea_preview_list.aspx" },
      });
    } catch (err: any) {
      if (attempt === retries || !isRetryableNetworkError(err)) throw err;
      const backoff = 400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 300);
      await sleep(backoff);
    }
  }
  throw new Error("unreachable");
}
