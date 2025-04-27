import CourseModel from "../models/Course"

export interface Interest{
    id: number,
    user_id: number,
    course_id: number,
    created_at: Date
}

export type AllInterestsResponse = Interest & {
    course: CourseModel
}