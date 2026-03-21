export interface CourseTimeslot {
  dayOfWeek: number;
  startPeriod: string;
  endPeriod: string;
  startMin: number;
  endMin: number;
}

export interface TimetableConflict {
  courseId: number;
  conflictWithCourseId: number;
  dayOfWeek: number;
  overlap: {
    startMin: number;
    endMin: number;
    startPeriod: string;
    endPeriod: string;
  };
}

export interface TimetableItemResponse {
  course: {
    id: number;
    name: string;
    semester: string;
    department: string;
    instructor: string;
    room?: string;
  };
  timeslots: CourseTimeslot[];
}

export interface TimetableResponse {
  timetable: {
    id: number;
    semester: string;
  };
  items: TimetableItemResponse[];
}

export interface AddedCourseItemResponse {
  timetableId: number;
  semester: string;
  hasTimeslots: boolean;
  course: {
    id: number;
    name: string;
    semester: string;
    department: string;
    instructor: string;
    room?: string;
    courseTime?: string;
  };
}
