import { BRAND, clampTitle, isNonEmptyText, TITLE_SEPARATOR } from './text'


type CourseTitleParams = {
  courseName: string
  teacherName?: string
  semester?: string
}

export function titleCourse(courseTitleParams: CourseTitleParams): string {
  const { courseName, teacherName, semester } = courseTitleParams

  const titleSegments = [
    BRAND,
    courseName,
    teacherName,
    semester,
  ].filter(isNonEmptyText)

  return clampTitle(titleSegments.join(TITLE_SEPARATOR))
}

export function titleStatic(pageName: string): string {
  const titleSegments = [
    BRAND,
    pageName,
  ].filter(isNonEmptyText)

  return clampTitle(titleSegments.join(TITLE_SEPARATOR))
}

export function titleCourseFallback(courseId?: string): string {
  const fallbackText = isNonEmptyText(courseId)
    ? `課程詳情（${courseId.trim()}）`
    : '課程詳情'

  return titleStatic(fallbackText)
}
