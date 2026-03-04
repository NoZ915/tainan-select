const periodOrderMap: Record<string, number> = {
  "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  "6": 6, "7": 7, "8": 8, "9": 9,
  "A": 10, "B": 11, "C": 12, "D": 13, "E": 14, "F": 15, "G": 16
};

const dayMap: Record<string, number> = {
  "一": 1,
  "二": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "日": 7,
};

interface CourseScheduleParsed {
  day: number;         // 星期幾（數字 1~7 -> 存進DB用）
  startPeriod: string; // 節次字串（可能是數字或字母）
  span: number;        // 節數長度
}

export const parseCourseTime = (courseTime?: string): CourseScheduleParsed[] => {
  if (!courseTime) return [];

  // 支援多天（用全形或半形分號分隔）
  const chunks = courseTime
    .split(/[；;]/)
    .map((c) => c.trim())
    .filter(Boolean);

  const schedules: CourseScheduleParsed[] = [];

  chunks.forEach((chunk) => {
    // 格式：「星期X，節次6、7、A...」
    const match = chunk.match(/^星期(.+?)，節次(.+)$/);
    if (!match) return;

    const dayStr = match[1]; // 例如 "四"
    const day = dayMap[dayStr];
    if (!day) return; // 避免無效的星期
    const periodsStr = match[2];
    const periods = periodsStr.split("、").map((p) => p.trim());

    if (periods.length > 0) {
      const start = periodOrderMap[periods[0]];
      const end = periodOrderMap[periods[periods.length - 1]];
      const span = (end - start) + 1;

      schedules.push({
        day,
        startPeriod: periods[0],
        span
      });
    }
  });

  return schedules;
};