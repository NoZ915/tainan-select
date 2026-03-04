export interface Timeslot {
  dayOfWeek: number
  startPeriod: string
  endPeriod: string
  startMin: number
  endMin: number
}

export interface TimetableCourse {
  id: number
  name: string
  semester: string
  instructor: string
  room?: string
}

export interface TimetableItem {
  course: TimetableCourse
  timeslots: Timeslot[]
}

export interface TimetableResponse {
  timetable: {
    id: number
    semester: string
  }
  items: TimetableItem[]
}

export interface AddedCourseItem {
  timetableId: number
  semester: string
  hasTimeslots: boolean
  course: {
    id: number
    name: string
    semester: string
    instructor: string
    room?: string
    courseTime?: string
  }
}

export interface TimetableConflict {
  courseId: number
  conflictWithCourseId: number
  dayOfWeek: number
  overlap: {
    startMin: number
    endMin: number
    startPeriod: string
    endPeriod: string
  }
}

export interface BatchAddFromInterestsResponse {
  summary: {
    requested: number
    eligibleSameSemester: number
    added: number
    skippedAlreadyExists: number
    conflicted: number
  }
  conflicts: TimetableConflict[]
}

export interface AddTimetableCourseResponse {
  added: boolean
  alreadyExists: boolean
  item?: {
    courseId: number
  }
  conflicts: TimetableConflict[]
}

export interface SwapTimetableCourseResponse {
  added: boolean
  alreadyExists: boolean
  removedCourseIds: number[]
}
