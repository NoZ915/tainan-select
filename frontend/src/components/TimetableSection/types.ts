import { AddedCourseItem } from '../../types/timetableType'

export type Weekday = '一' | '二' | '三' | '四' | '五' | '六' | '日'

export type WeekdayOption = {
  label: Weekday
  value: number
}

export type GridCell = {
  courseId: number
  courseName: string
  instructor: string
  room?: string
}

export type TimetableGrid = Record<string, Partial<Record<number, GridCell[]>>>

export type SelectableInterestCourse = {
  id: number
  course_name: string
  semester: string
  instructor: string
  course_room?: string
  course_time?: string
}

export type AddedTimetableItem = AddedCourseItem
