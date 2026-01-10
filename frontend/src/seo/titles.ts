import { BRAND, clampTitle, isNonEmptyText, TITLE_SEPARATOR } from './text'


type CourseTitleParams = {
  courseName: string
  teacherName?: string
  semester?: string
}

export function buildTitleCourse(courseTitleParams: CourseTitleParams): string {
  const { courseName, teacherName, semester } = courseTitleParams

  const titleSegments = [
    BRAND,
    courseName,
    teacherName,
    semester,
  ].filter(isNonEmptyText)

  return clampTitle(titleSegments.join(TITLE_SEPARATOR))
}

export function buildTitleStatic(pageName: string): string {
  const titleSegments = [
    BRAND,
    pageName,
  ].filter(isNonEmptyText)

  return clampTitle(titleSegments.join(TITLE_SEPARATOR))
}

export function buildTitleCourseFallback(courseId?: string): string {
  const fallbackText = isNonEmptyText(courseId)
    ? `課程詳情（${courseId.trim()}）`
    : '課程詳情'

  return buildTitleStatic(fallbackText)
}
