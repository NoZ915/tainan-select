import "dotenv/config";
import axios from "axios";
import pLimit from "p-limit";
import * as cheerio from "cheerio";
import db from "../models";
import Course from "../models/Course";
import { googleRequestCURL } from "./googleRequestCURL";
import { getWithRetry } from "./httpClient";
import { normalizeCourseTime, parseCourseTime } from "../utils/parseCourseTime";
import { normalizeCourseType } from "../utils/normalizeCourseType";
import { parseCourseIdentityFromUrl } from "../utils/courseIdentity";
import { extractClassName, parseGradesFromClassName, parseGraduateLevelsFromClassName } from "../utils/parseCourseClass";
import CourseScheduleModel from "../models/CourseSchedule";

const courses: string[] = [];

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
          const courseTimeElement = coursePage$("#Label10").clone();
          courseTimeElement.find("br").replaceWith("\n");
          const rawCourseTime = courseTimeElement.text();
          const courseTime = normalizeCourseTime(rawCourseTime);
          const courseRoom = coursePage$("#Label11").text();
          const rawCourseType = coursePage$("#Label16").text();
          const courseType = normalizeCourseType(rawCourseType);

          const courseClassElement = coursePage$("#Label5").clone();
          courseClassElement.find("br").replaceWith("\n");
          const rawCourseClass = courseClassElement.text();
          const className = extractClassName(rawCourseClass);
          const grades = className ? parseGradesFromClassName(className) : null;
          const graduateLevels = className ? parseGraduateLevelsFromClassName(className) : null;

          // cour_no + course_dep_code 是課程網址帶的開課序號，用來識別「同系所同課名同老師」
          // 也可能是不同班次的情況（例如必修課同老師連開兩班）；解析失敗時退回舊比對方式。
          const identity = parseCourseIdentityFromUrl(course.courseURL);

          const existingCourse = identity
            ? await Course.findOne({
                where: {
                  cour_no: identity.cour_no,
                  course_dep_code: identity.course_dep_code,
                  semester: course.semester,
                },
              })
            : await Course.findOne({
                where: {
                  department: course.department,
                  course_name: course.courseName,
                  instructor: course.instructor,
                },
              });

          if (existingCourse) {
            await db.sequelize.transaction(async (transaction) => {
              await existingCourse.update(
                {
                  semester: course.semester,
                  academy: course.academy,
                  instructor_url: course.instructorURL,
                  course_room: courseRoom,
                  course_time: courseTime,
                  course_url: course.courseURL,
                  cour_no: identity?.cour_no ?? existingCourse.cour_no,
                  course_dep_code: identity?.course_dep_code ?? existingCourse.course_dep_code,
                  credit_hours: parseInt(course.creditHours),
                  course_type: courseType,
                  class_name: className,
                  grades,
                  graduate_levels: graduateLevels,
                  updated_at: new Date(),
                },
                { transaction }
              );

              // 刪除舊的 CourseSchedule 再新增
              await CourseScheduleModel.destroy({ where: { course_id: existingCourse.id }, transaction });
              const schedules = parseCourseTime(courseTime);
              await CourseScheduleModel.bulkCreate(
                schedules.map(s => ({
                  course_id: existingCourse.id,
                  day: Number(s.day),
                  start_period: s.startPeriod,
                  span: s.span
                })),
                { transaction }
              );
            });

          } else {
            await db.sequelize.transaction(async (transaction) => {
              const createdCourse = await Course.create(
                {
                  course_name: course.courseName,
                  department: course.department,
                  academy: course.academy,
                  instructor: course.instructor,
                  instructor_url: course.instructorURL,
                  course_room: courseRoom,
                  course_time: courseTime,
                  course_url: course.courseURL,
                  cour_no: identity?.cour_no,
                  course_dep_code: identity?.course_dep_code,
                  credit_hours: parseInt(course.creditHours),
                  semester: course.semester,
                  id: undefined as any, // 明確設為 undefined，讓資料庫生成
                  created_at: new Date(), // 提供當前時間
                  updated_at: new Date(), // 提供當前時間
                  course_type: courseType,
                  class_name: className,
                  grades,
                  graduate_levels: graduateLevels,
                  interests_count: 0,
                  review_count: 0,
                  view_count: 0,
                  dcard_related_post_count: 0,
                },
                { transaction }
              );

              const schedules = parseCourseTime(courseTime);
              await CourseScheduleModel.bulkCreate(
                schedules.map(s => ({
                  course_id: createdCourse.id,
                  day: Number(s.day),
                  start_period: s.startPeriod,
                  span: s.span,
                })),
                { transaction }
              );
            });
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
