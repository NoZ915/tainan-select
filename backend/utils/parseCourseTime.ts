const PERIOD_ORDER = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G"] as const;
const PERIOD_ORDER_MAP: Record<string, number> = PERIOD_ORDER.reduce<Record<string, number>>((acc, period, index) => {
  acc[period] = index + 1;
  return acc;
}, {});

const DAY_MAP: Record<string, number> = {
  "一": 1,
  "二": 2,
  "三": 3,
  "四": 4,
  "五": 5,
  "六": 6,
  "日": 7,
};

interface CourseScheduleParsed {
  day: number;
  startPeriod: string;
  span: number;
}

const PERIOD_SEPARATORS = new Set(["、", "，", ",", "/", "-", "~"]);

const extractLeadingPeriodTokens = (sectionAfterMarker: string): string[] => {
  const source = sectionAfterMarker.trim().toUpperCase();

  // Require a valid period token at the beginning; this avoids notes like "第10週".
  if (!/^[1-9A-G]/.test(source)) return [];

  const tokens: string[] = [];
  for (const ch of source) {
    if (PERIOD_ORDER_MAP[ch]) {
      tokens.push(ch);
      continue;
    }

    if (PERIOD_SEPARATORS.has(ch)) {
      continue;
    }

    // Stop at the first non-period/non-separator char (annotation boundary).
    break;
  }

  return tokens.filter((token, index, arr) => index === 0 || token !== arr[index - 1]);
};

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

      const sectionAfterMarker = chunk.includes("節次") ? chunk.split("節次")[1] : "";
      const periodTokens = extractLeadingPeriodTokens(sectionAfterMarker);
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

  // 格式：「星期X，節次6、7、A...」
  chunks.forEach((chunk) => {
    const match = chunk.match(/^星期([一二三四五六日])，節次([1-9A-G](?:、[1-9A-G])*)$/i);
    if (!match) return;

    const day = DAY_MAP[match[1]];
    if (!day) return;

    const periods = match[2]
      .split("、")
      .map((p) => p.trim().toUpperCase())
      .filter((p) => Boolean(PERIOD_ORDER_MAP[p]));

    if (periods.length === 0) return;

    const start = PERIOD_ORDER_MAP[periods[0]];
    const end = PERIOD_ORDER_MAP[periods[periods.length - 1]];
    if (!start || !end || end < start) return;

    schedules.push({
      day,
      startPeriod: periods[0],
      span: (end - start) + 1,
    });
  });

  return schedules;
};
