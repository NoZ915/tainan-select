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

export function buildCoursesListTitle(search: string) {
  const params = new URLSearchParams(search)

  const keyword = params.get('search')?.trim()
  const academy = params.get('academy')?.trim()
  const department = params.get('department')?.trim()
  const category = params.get('category')?.trim()

  if (!keyword && !academy && !department && !category) {
    return buildTitleStatic('課程列表')
  }

  const parts: string[] = []
  if (keyword) parts.push(`搜尋：${keyword}`)

  if (department) parts.push(department)
  else if (academy) parts.push(academy)
  else if (category) parts.push(category)

  return buildTitleStatic(parts.join('｜'))
}