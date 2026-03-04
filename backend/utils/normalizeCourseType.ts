export const normalizeCourseType = (rawCourseType?: string): string => {
  if (!rawCourseType) return "";

  const compact = rawCourseType.replace(/\s+/g, "");
  if (compact.includes("必選修")) return "必選修";
  if (compact.includes("必修")) return "必修";
  if (compact.includes("選修")) return "選修";

  // fallback: 去除英文字與符號，只保留中文內容
  return rawCourseType
    .replace(/[A-Za-z]/g, "")
    .replace(/[()[\]{}:：/\\\-_,.;]/g, "")
    .trim();
};
