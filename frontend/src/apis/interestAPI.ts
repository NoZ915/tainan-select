import { ToggleInterestResult } from "../types/interestType";
import { axiosInstance } from "./axiosInstance"

export const toggleInterest = async(course_id: number): Promise<ToggleInterestResult> => {
    const response = await axiosInstance.post("/interests/toggleInterest", { course_id });
    return response.data;
}