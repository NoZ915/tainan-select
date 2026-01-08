import { Course } from './courseType'

export interface Interest{
    id: number,
    user_id: number,
    course_id: number,
    created_at: Date
}

export interface ToggleInterestResult{
	isInterest: boolean,
	message: string
}

export type AllInterestsResponse = Interest & {
    course: Course
}