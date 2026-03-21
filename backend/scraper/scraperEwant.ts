import "dotenv/config";
import axios from "axios";
import https from "https";
import pLimit from "p-limit";
import * as cheerio from "cheerio";
import { Op } from "sequelize";
import db from "../models";
import CourseModel from "../models/Course";

// ewant api 回來的 data type
type GetCourseItem = {
  Result: string;
  Message: string;
  sYear: string;
  Sec: string;
  SelCourNo: string;
  CourNo: string;

  CourName: string;
  CourEngName: string;

  ClassName1: string;

  TeaNo1: string;
  TeaName1: string;
  TeaName: string;
  TeaEmail: string;
  AlPt: string;

  Credit: string;
  TotHour: string;

  Week: string;
  Section: string;

  Room: string;
  ComptRoom: string;

  Method: string;
  EMI: string;
  Dist: string;
  Coord: string;
  Remark: string;

  MaxSel: string;
  MinSel: string;
  NowSel: string;
};

const BASE_URL = "https://academics.nutn.edu.tw";
const PAGE_URL = `${BASE_URL}/Course/Qry/cos`;
const API_URL = `${BASE_URL}/Course/api/Query/GetCourse`;
const EWANT_SEARCH_URL =
  "https://www.ewant.org/admin/tool/mooccourse/allcourses.php?filter=4&schoolid=0&categoryid=0&course_filter=3&search=";

// 要爬的條件：114-2 / 其他 / 校外遠距(EWANT)
const PAYLOAD = {
  acs: "1142", // acadamic semester 學期：1142 = 114-2
  kw: "",
  dc: "",
  gr: "",
  ch: "",
  ot: "DIS_1", // 類別：校外遠距(EWANT)
  ge: "A",
  ta: "ZZS101",
  we: "",
  ki: "6", // 單位：其他
  ll: "zh-TW",
};

const DEPARTMENT_LABEL = "校外遠距(EWANT)";

// 處理爬蟲被擋的問題
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
});

const detailClient = axios.create({
  httpsAgent,
  timeout: 15_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    Accept: "*/*",
  },
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryableNetworkError(err: any) {
  const code = err?.code;
  const status = err?.response?.status;

  return (
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNABORTED" ||
    code === "EAI_AGAIN" ||
    code === "ENOTFOUND" ||
    status === 429 ||
    (status >= 500 && status <= 599)
  );
}

async function postWithRetry<T>(
  url: string,
  data: any,
  headers: Record<string, string>,
  retries = 3
) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await detailClient.post<T>(url, data, { headers });
    } catch (err: any) {
      if (attempt === retries || !isRetryableNetworkError(err)) throw err;
      const backoff = 400 * 2 ** (attempt - 1) + Math.floor(Math.random() * 300);
      await sleep(backoff);
    }
  }
  throw new Error("unreachable");
}

// 初始化 DB
async function initializeDatabase(): Promise<void> {
  try {
    await db.sequelize.authenticate();
    console.log("MySQL 連線成功");
  } catch (error) {
    console.error("無法連接到 MySQL:", error);
    process.exit(1);
  }
}

function pickCookieHeader(setCookie?: string[] | string): string {
  if (!setCookie) return "";
  const array = Array.isArray(setCookie) ? setCookie : [setCookie];
  return array
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

function formatSemesterFromAcs(acs: string) {
  // "1142" -> "114-2"
  if (!acs || acs.length < 4) return acs;
  return `${acs.slice(0, 3)}-${acs.slice(3)}`;
}

function buildInstructorName(item: GetCourseItem) {
  const name = (item.TeaName1 || item.TeaName || "").trim();
  if (!name || name === "無") return "無教師";
  return name;
}

function buildInstructorUrl(item: GetCourseItem) {
  // 依你貼的前端 getTea() 邏輯
  const teano = (item.TeaNo1 || "").trim();
  const apl = (item.AlPt || "").trim();
  const email = (item.TeaEmail || "").trim();
  const teaname = (item.TeaName1 || "").trim();

  if (!teano || !teaname) return undefined;

  if (apl === "1" && email) {
    const id = email.split("@")[0];
    return `https://gaweb.nutn.edu.tw/faculty/teaData.aspx?id=${id}`;
  }

  return `${BASE_URL}/Course/Qry/TeaInfo?id=${teano}&ap=${apl}`;
}

function buildCourseUrl(courseName: string) {
  return `${EWANT_SEARCH_URL}${encodeURIComponent(courseName)}`;
}

async function fetchSession(): Promise<{ csrfToken: string; cookie: string }> {
  const res = await detailClient.get(PAGE_URL, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      referer: PAGE_URL,
    },
  });

  const cookie = pickCookieHeader(res.headers["set-cookie"]);
  const $ = cheerio.load(res.data);

  const csrfToken = ($("#ctl00_hv_token").val() as string) || "";

  if (!csrfToken) {
    throw new Error("無法從頁面抓到 csrf token (#ctl00_hv_token)");
  }

  return { csrfToken, cookie };
}

async function runScraper(): Promise<void> {
  try {
    const semester = formatSemesterFromAcs(PAYLOAD.acs);

    // 1) 先拿 csrf + cookie
    const { csrfToken, cookie } = await fetchSession();

    // 2) 打 API
    const headers = {
      accept: "*/*",
      "content-type": "application/json; charset=utf-8",
      origin: BASE_URL,
      referer: PAGE_URL,
      cookie,
      "x-csrf-token": csrfToken,
    };

    const res = await postWithRetry<GetCourseItem[]>(API_URL, PAYLOAD, headers, 3);
    const data = res.data || [];
    const items = data.filter((x) => x && x.Result === "00");

    console.log(`GetCourse 回傳: ${data.length} 筆，Result=00: ${items.length} 筆`);

    const limit = pLimit(10);
    let created = 0;
    let updated = 0;
    let failed = 0;

    const tasks = items.map((item) =>
      limit(async () => {
        try {
          const courseName = (item.CourName || "").trim() || "未知課程";
          const courseUrl = buildCourseUrl(courseName);
          const instructorName = buildInstructorName(item);
          const instructorUrl = buildInstructorUrl(item);

          // ✅ 依你需求：遠距固定寫「遠距」，不看 API Room（也不 trim）
          // ✅ course_time 讓它空（不存）
          // ✅ course_url 不存
          const payload = {
            semester,
            academy: "其他", // 你也可以改成 null，不影響（欄位可空）
            department: DEPARTMENT_LABEL,
            course_name: courseName,
            instructor: instructorName,
            instructor_url: instructorUrl,
            course_room: "遠距",
            course_url: courseUrl,
            credit_hours: Number.parseInt(item.Credit || "0", 10) || 0,
            course_type: "選修",
            updated_at: new Date(),
          };

          const existing = await CourseModel.findOne({
            where: {
              semester: payload.semester,
              department: payload.department,
              course_name: payload.course_name,
              instructor: {
                [Op.in]: [payload.instructor, "EWANT教師", "無教師"],
              },
              credit_hours: payload.credit_hours,
            },
          });

          if (existing) {
            await existing.update(payload);
            updated++;
            return;
          }

          await CourseModel.create(payload as any);
          created++;
        } catch (err) {
          failed++;
          console.error(`寫入失敗：${item.CourName} (${item.SelCourNo})`, err);
        }
      })
    );

    await Promise.all(tasks);

    console.log(`完成：created=${created}, updated=${updated}, failed=${failed}`);
    process.exit(0);
  } catch (error) {
    console.error("Error scraping EWANT courses:", error);
    process.exit(1);
  }
}

initializeDatabase().then(() => runScraper());
