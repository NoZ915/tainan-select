import { AllInterestsResponse, ToggleInterestResult } from '../types/interestType'
import { axiosInstance } from './axiosInstance'

export const toggleInterest = async (course_id: number): Promise<ToggleInterestResult> => {
    const response = await axiosInstance.post('/interests/toggleInterest', { course_id })
    return response.data
}

export const getAllInterests = async ({ pageParam = 0 }): Promise<AllInterestsResponse[]> => {
    const limit = 10
    const response = await axiosInstance.get('/interests/getAllInterests', {
        params: { limit, offset: pageParam },
    })
    return response.data
}