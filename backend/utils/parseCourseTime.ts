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

export const normalizeCourseTime = (courseTime?: string): string => {
  if (!courseTime) return "";

  const chunks = courseTime
    .replace(/\s+/g, "")
    .split(/[；;]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const normalizedChunks = chunks
    .map((chunk) => {
      const dayMatch = chunk.match(/星期([一二三四五六日])/);
      if (!dayMatch) return "";

      const sectionAfterPeriod = chunk.includes("節次") ? chunk.split("節次")[1] : "";
      const firstToken = sectionAfterPeriod.match(/^([1-9A-G])/i)?.[1]?.toUpperCase();
      const standaloneTokens =
        (sectionAfterPeriod.match(/(^|[^A-Za-z])([1-9A-G])(?=[^A-Za-z]|$)/gi) || [])
          .map((token) => token.replace(/[^1-9A-G]/gi, "").toUpperCase())
          .filter(Boolean);
      const mergedTokens = [...(firstToken ? [firstToken] : []), ...standaloneTokens];
      const periodTokens = mergedTokens.filter((token, index, array) => {
        if (index === 0) return true;
        return token !== array[index - 1];
      });

      if (periodTokens.length === 0) return "";
      return `星期${dayMatch[1]}，節次${periodTokens.join("、")}`;
    })
    .filter(Boolean);

  return normalizedChunks.join("；");
};

export const parseCourseTime = (courseTime?: string): CourseScheduleParsed[] => {
  const normalizedCourseTime = normalizeCourseTime(courseTime);
  if (!normalizedCourseTime) return [];

  // 支援多天（用全形或半形分號分隔）
  const chunks = normalizedCourseTime
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
