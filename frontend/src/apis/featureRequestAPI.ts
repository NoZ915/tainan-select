import { FeatureRequest, FeatureRequestStatus, ToggleFeatureRequestVoteResult } from '../types/featureRequestType'
import { axiosInstance } from './axiosInstance'

export const getFeatureRequests = async (status?: FeatureRequestStatus): Promise<FeatureRequest[]> => {
  const response = await axiosInstance.get('/feature-requests', {
    params: status ? { status } : undefined,
  })
  return response.data
}

export const createFeatureRequest = async (content: string): Promise<void> => {
  await axiosInstance.post('/feature-requests', { content })
}

export const toggleFeatureRequestVote = async (id: number): Promise<ToggleFeatureRequestVoteResult> => {
  const response = await axiosInstance.post(`/feature-requests/${id}/vote`)
  return response.data
}

export const updateFeatureRequestStatus = async (id: number, status: FeatureRequestStatus): Promise<void> => {
  await axiosInstance.patch(`/feature-requests/${id}/status`, { status })
}

export const updateFeatureRequestAdminReply = async (id: number, admin_reply: string): Promise<void> => {
  await axiosInstance.patch(`/feature-requests/${id}/reply`, { admin_reply })
}

export const deleteFeatureRequest = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/feature-requests/${id}`)
}