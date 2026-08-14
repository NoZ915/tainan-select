import { AddedCourseItem } from '../../types/timetableType'
import type { TimetablePeriod } from '../../utils/timetable'

export type Weekday = '一' | '二' | '三' | '四' | '五' | '六' | '日'

export type WeekdayOption = {
  label: Weekday
  value: number
}

export type TimetableSlotSelection = {
  dayOfWeek: number
  period: TimetablePeriod
}

export type TimetableListItem = {
  timetableId?: number
  semester: string
  hasTimeslots: boolean
  course: AddedCourseItem['course']
}
