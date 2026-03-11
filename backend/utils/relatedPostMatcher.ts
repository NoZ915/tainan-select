export type RelatedPostCourseRow = {
  id: number;
  course_name: string;
  instructor: string;
  semester: string | null;
};

export type RelatedPostMatch = {
  course: RelatedPostCourseRow;
  score: number;
  matched_keywords: string[];
};

const MIN_KEYWORD_LENGTH = 2;

export const normalizeRelatedPostText = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, "");

export const sanitizeRelatedPostText = (value?: string | null): string =>
  (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[【】「」『』（）()［］\[\]、，,。.!！?？:：;；"'`~\-_/\\|]/g, " ")
    .trim();

export const buildCourseKeywords = (course: RelatedPostCourseRow): string[] => {
  const candidates = [
    course.course_name,
    course.instructor,
    course.course_name.replace(/\s+/g, ""),
    course.instructor.replace(/\s+/g, ""),
  ];

  return [
    ...new Set(
      candidates
        .map((item) => normalizeRelatedPostText(sanitizeRelatedPostText(item)))
        .filter((item) => item.length >= MIN_KEYWORD_LENGTH)
    ),
  ];
};

export const scoreCourseTextMatch = (
  normalizedHaystack: string,
  course: RelatedPostCourseRow
): { score: number; matched_keywords: string[] } => {
  const matchedKeywords = new Set<string>();
  let score = 0;

  for (const keyword of buildCourseKeywords(course)) {
    if (!normalizedHaystack.includes(keyword)) continue;
    matchedKeywords.add(keyword);
    score += keyword === normalizeRelatedPostText(course.course_name) ? 8 : 3;
    if (keyword === normalizeRelatedPostText(course.instructor)) {
      score += 4;
    }
  }

  return {
    score,
    matched_keywords: [...matchedKeywords],
  };
};

export const matchPostToCourses = (
  title: string,
  excerpt: string | null | undefined,
  courses: RelatedPostCourseRow[],
  maxMatches: number
): RelatedPostMatch[] => {
  const normalizedHaystack = normalizeRelatedPostText(
    `${sanitizeRelatedPostText(title)} ${sanitizeRelatedPostText(excerpt)}`
  );

  if (!normalizedHaystack) return [];

  return courses
    .map((course) => ({
      course,
      ...scoreCourseTextMatch(normalizedHaystack, course),
    }))
    .filter((item) => item.score > 0 && item.matched_keywords.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxMatches);
};

export const parseDcardPostIdFromUrl = (url: string): number | null => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname !== "dcard.tw" && hostname !== "www.dcard.tw") {
    return null;
  }

  const match = parsedUrl.pathname.match(/\/p\/(\d+)/);
  if (!match) return null;

  const postId = Number(match[1]);
  return Number.isFinite(postId) ? postId : null;
};
