export type RelatedPostCourseRow = {
  id: number;
  course_name: string;
  department: string;
  instructor: string;
  semester: string | null;
};

export type RelatedPostMatch = {
  course: RelatedPostCourseRow;
  score: number;
  matched_keywords: string[];
};

const MIN_KEYWORD_LENGTH = 2;
const COMMON_TITLES = ["老師", "教授", "助教", "博士"];

type KeywordCandidate = {
  value: string;
  score: number;
};

export const normalizeRelatedPostText = (value: string): string =>
  value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");

export const sanitizeRelatedPostText = (value?: string | null): string =>
  (value ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const buildNameFragments = (value: string): string[] => {
  const sanitized = sanitizeRelatedPostText(value);
  if (!sanitized) return [];

  return sanitized
    .split(/\s+/)
    .flatMap((token) => {
      const strippedTitleToken = COMMON_TITLES.reduce(
        (current, title) => current.replace(new RegExp(title, "g"), " "),
        token
      );

      return [token, strippedTitleToken]
        .map((item) => item.trim())
        .filter((item) => item.length >= MIN_KEYWORD_LENGTH);
    });
};

const buildCourseKeywordCandidates = (course: RelatedPostCourseRow): KeywordCandidate[] => {
  const courseName = normalizeRelatedPostText(sanitizeRelatedPostText(course.course_name));
  const instructor = normalizeRelatedPostText(sanitizeRelatedPostText(course.instructor));
  const courseNameFragments = buildNameFragments(course.course_name)
    .map((item) => normalizeRelatedPostText(item))
    .filter((item) => item.length >= MIN_KEYWORD_LENGTH);
  const instructorFragments = buildNameFragments(course.instructor)
    .map((item) => normalizeRelatedPostText(item))
    .filter((item) => item.length >= MIN_KEYWORD_LENGTH);

  return [
    { value: courseName, score: 8 },
    { value: instructor, score: 7 },
    ...courseNameFragments.map((value) => ({ value, score: 3 })),
    ...instructorFragments.map((value) => ({ value, score: 4 })),
  ].filter(
    (candidate, index, candidates) =>
      candidate.value.length >= MIN_KEYWORD_LENGTH &&
      candidates.findIndex((item) => item.value === candidate.value) === index
  );
};

export const buildCourseKeywords = (course: RelatedPostCourseRow): string[] =>
  buildCourseKeywordCandidates(course).map((candidate) => candidate.value);

export const scoreCourseTextMatch = (
  normalizedHaystack: string,
  course: RelatedPostCourseRow
): { score: number; matched_keywords: string[] } => {
  const matchedKeywords = new Set<string>();
  let score = 0;

  for (const keyword of buildCourseKeywordCandidates(course)) {
    if (!normalizedHaystack.includes(keyword.value)) continue;
    matchedKeywords.add(keyword.value);
    score += keyword.score;
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
