import * as cheerio from "cheerio";

export interface CourseListItem {
  semester: string;
  academy: string;
  department: string;
  courseName: string;
  courseURL: string;
  instructor: string;
  instructorURL: string;
  creditHours: string;
}

// 課程列表的欄位順序（共8欄）：
// [0]開課學院 [1]開課系所 [2]課程名稱 [3]授課教師 [4]學分數 [5]課程大綱 [6]能力指標 [7]SDGs
//
// 只有 [2][3][5] 這三欄可能帶連結：
//   [2] 課程名稱 → tea_preview_detail.aspx?...&course_dep_code=xxxx（每堂課都有）
//   [3] 授課教師 → 教師個人頁（絕對網址，且分屬兩個不同網域）
//   [5] 課程大綱 → 「檢視」時有連結、「整理中」時是純文字沒有連結
//   [6][7] 是「未完成 / 已完成」狀態文字，本來就不會有連結
//
// 課程頁網址一律取 [2] 而非 [5]：只有 [2] 的連結帶 course_dep_code，
// 那是 parseCourseIdentityFromUrl 用來識別課程的必要參數；
// 取 [2] 也讓課程大綱還在「整理中」的課同樣能被抓到。
const COURSE_ROW_CELL_COUNT = 8;
const COURSE_LIST_BASE_URL = "https://ecourse.nutn.edu.tw/public/";

/**
 * 解析課程列表頁（tea_preview_list.aspx）的 HTML。
 *
 * 逐 <tr> 逐欄位解析，不依賴「整張表攤平後每堂課固定佔N個元素」這種假設──
 * 那種寫法只要學校網站多一欄、少一個連結，後面所有課程就會整體位移。
 */
export function parseCourseListPage(html: string): CourseListItem[] {
  const $ = cheerio.load(html);

  // 標題長這樣：「115 學年度 第 1 學期 課程大綱」→ 取出 1151 → 115-1
  // 解析不出4碼就直接炸掉：否則會用 semester="-" 去更新整個資料庫，比爬不到資料更糟
  const semester = $("#label_title2")
    .text()
    .replace(/[^0-9]/gi, "");
  if (!/^\d{4}$/.test(semester)) {
    throw new Error(
      `無法解析學期：從 #label_title2 取得 "${semester}"，學校網站結構可能已改版`
    );
  }
  const formattedSemester = `${semester.slice(0, 3)}-${semester.slice(3)}`;

  const cellText = (el: cheerio.Cheerio<any>) => el.text().replace(/\s*/g, "");

  const courses: CourseListItem[] = [];

  $("table > tbody > tr").each(function () {
    const cells = $(this).children("td");
    // 頁面上還有一張各學院上傳率統計表（5欄），欄數不符的一律略過
    if (cells.length !== COURSE_ROW_CELL_COUNT) return;

    const courseLink = cells.eq(2).find('a[href*="tea_preview_detail"]');
    const courseHref = courseLink.attr("href");
    if (!courseHref) return; // 表頭列沒有連結

    // 課程名稱直接取 <a> 的文字。整格的原始HTML是
    // `<a ...>地質學</a><br>[134027]`，開課序號在 <a> 之外，
    // 所以取 <a> 就不必再依賴「切掉 [xxxxx]」這種文字格式假設。
    courses.push({
      semester: formattedSemester,
      academy: cellText(cells.eq(0)),
      department: cellText(cells.eq(1)) || "未知系所",
      courseName: cellText(courseLink) || "未知課程",
      courseURL: new URL(courseHref, COURSE_LIST_BASE_URL).href,
      instructor: cellText(cells.eq(3)) || "未知教師",
      instructorURL: cells.eq(3).find("a").attr("href") ?? "",
      creditHours: cellText(cells.eq(4)) || "0",
    });
  });

  return courses;
}
