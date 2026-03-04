import "dotenv/config";
import axios from "axios";
import https from "https";
import pLimit from "p-limit";
import * as cheerio from "cheerio";
import db from "../models";
import Course from "../models/Course";
import { googleRequestCURL } from "./googleRequestCURL";
import { parseCourseTime } from "../utils/parseCourseTime";
import CourseScheduleModel from "../models/CourseSchedule";

const courses: string[] = [];

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

async function getWithRetry(url: string, retries = 3) {
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

// 初始化，跟server.ts做的事情一樣
// 不過scraper.ts只有要重新爬蟲課程資料才會執行
// 所以拉出來獨立執行
async function initializeDatabase(): Promise<void> {
  try {
    await db.sequelize.authenticate();
    console.log("MySQL 連線成功");
  } catch (error) {
    console.error("無法連接到 MySQL:", error);
    process.exit(1);
  }
}

async function runScraper(): Promise<void> {
  try {
    const response = await axios.post(
      "https://ecourse.nutn.edu.tw/public/tea_preview_list.aspx",
      googleRequestCURL,
      {
        headers: {
          accept: "*/*",
          "accept-language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-CN;q=0.6",
          "cache-control": "no-cache",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          cookie:
            "_ga_KBTFR9VFYX=GS1.3.1689954257.1.0.1689954257.0.0.0; _ga_PS0433VQVF=GS1.1.1714835699.1.1.1714835713.46.0.0; _ga=GA1.1.1027456643.1629120893; moo=sd1j4d5vfoshqkpfhe14js2u; __RequestVerificationToken=pCWrJympzkXGHwZWESrREP0YsL_JY13a_ufXUsAeb4X0klIyUGuOrRRySDx98E9dHYKOqgCRT3nSmyH7FQKvuy33lHO3TMLjU9JLx_bfOGg1",
          origin: "https://ecourse.nutn.edu.tw",
          pragma: "no-cache",
          priority: "u=1, i",
          referer: "https://ecourse.nutn.edu.tw/public/tea_preview_list.aspx",
          "sec-ch-ua":
            '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
          "sec-ch-ua-mobile": "?1",
          "sec-ch-ua-platform": '"Android"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
          "x-microsoftajax": "Delta=true",
          "x-requested-with": "XMLHttpRequest",
        },
      }
    );

    // cheerio取得資料
    const $ = cheerio.load(response.data);
    $("table > tbody > tr > td").each(function () {
      courses.push($(this).text().split("\n")[1].replace(/\s*/g, ""));
      // * 處理特例「整理中」，整理中沒有url，會導致後續course在切資料出錯
      if ($(this).text().split("\n")[1].replace(/\s*/g, "") === "整理中") {
        courses.push("no link");
      }
      // * 正常來說，課程、教師、檢視，這三個欄位都會有url
      // * 暫時先這樣，之後也許可以改成不管沒有url都要再多push一個東西，只是底下course切的位置得修正
      const href = $(this).find("a").attr("href");
      if (href) {
        courses.push(href); // 只有當 href 存在時才push
      }
    });

    // cheerio取得學期
    const semester = $("#label_title2")
      .text()
      .replace(/[^0-9]/gi, "");

    // 整理取得的資料
    const formattedData: {
      semester: string;
      academy: string;
      department: string;
      courseName: string;
      courseURL: string;
      instructor: string;
      instructorURL: string;
      creditHours: string;
    }[] = [];

    for (let i = 0; i < courses.length; i += 11) {
      const course = {
        semester: `${semester.slice(0, 3)}-${semester.slice(3)}`,
        academy: courses.slice(53)[i] || "",
        department: courses.slice(53)[i + 1] || "未知系所",
        courseName: courses.slice(53)[i + 2]?.split("[")[0] || "未知課程",
        courseURL: `https://ecourse.nutn.edu.tw/public/${courses.slice(53)[i + 3] || ""}`,
        instructor: courses.slice(53)[i + 4] || "未知教師",
        instructorURL: courses.slice(53)[i + 5] || "",
        creditHours: courses.slice(53)[i + 6] || "0",
      };
      formattedData.push(course);
    }

    const limit = pLimit(6); // 先 6，穩了再調 8 or 10
    let failed = 0;

    // 針對每一個course，都進到各自對應的courseURL進行爬蟲
    const tasks = formattedData.map((course) =>
      limit(async () => {
        try {
          if (!course.courseURL || course.courseURL.endsWith("/no link")) return;

          const res = await getWithRetry(course.courseURL);
          const coursePage$ = cheerio.load(res.data);

          // 抓取課程頁面中的資料
          const courseTime = coursePage$("#Label10").text();
          const courseRoom = coursePage$("#Label11").text();
          const courseType = coursePage$("#Label16").text();

          const existingCourse = await Course.findOne({
            where: {
              department: course.department,
              course_name: course.courseName,
              instructor: course.instructor,
            },
          });

          if (existingCourse) {
            await existingCourse.update({
              semester: course.semester,
              academy: course.academy,
              instructor_url: course.instructorURL,
              course_room: courseRoom,
              course_time: courseTime,
              course_url: course.courseURL,
              credit_hours: parseInt(course.creditHours),
              course_type: courseType,
              updated_at: new Date(),
            });

            // 刪除舊的 CourseSchedule 再新增
            await CourseScheduleModel.destroy({ where: { course_id: existingCourse.id } });
            const schedules = parseCourseTime(courseTime);
            await CourseScheduleModel.bulkCreate(
              schedules.map(s => ({
                course_id: existingCourse.id,
                day: Number(s.day),
                start_period: s.startPeriod,
                span: s.span
              }))
            );

          } else {
            const createdCourse = await Course.create({
              course_name: course.courseName,
              department: course.department,
              academy: course.academy,
              instructor: course.instructor,
              instructor_url: course.instructorURL,
              course_room: courseRoom,
              course_time: courseTime,
              course_url: course.courseURL,
              credit_hours: parseInt(course.creditHours),
              semester: course.semester,
              id: undefined as any, // 明確設為 undefined，讓資料庫生成
              created_at: new Date(), // 提供當前時間
              updated_at: new Date(), // 提供當前時間
              course_type: courseType,
              interests_count: 0,
              review_count: 0,
              view_count: 0
            });

            const schedules = parseCourseTime(courseTime);
            await CourseScheduleModel.bulkCreate(
              schedules.map(s => ({
                course_id: createdCourse.id,
                day: Number(s.day),
                start_period: s.startPeriod,
                span: s.span,
              }))
            );
          }
        } catch (error) {
          failed++;
          console.error(
            `Error fetching course URL ${course.courseURL}, ${course.courseName}:`,
            error
          );
        }
      }));

    await Promise.all(tasks);
    console.log("All courses have been updated.");
    process.exit(0);
  } catch (error) {
    console.error("Error scraping courses:", error);
    process.exit(1);
  }
}

initializeDatabase().then(() => runScraper());
