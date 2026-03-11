import {
  AdminStatusResponse,
  DcardSourceImportPayload,
  GoogleSyncPayload,
  GoogleSyncResponse,
  ManualImportPreviewResponse,
  ManualImportResponse,
  RelatedPostOverviewResponse,
} from '../types/adminType'
import { axiosInstance } from './axiosInstance'

export const getAdminStatus = async (): Promise<AdminStatusResponse> => {
  const response = await axiosInstance.get('/admin/status')
  return response.data
}

export const getRelatedPostOverview = async (params?: {
  recentPostsPage?: number;
  recentImportsPage?: number;
}): Promise<RelatedPostOverviewResponse> => {
  const response = await axiosInstance.get('/admin/related-posts/overview', {
    params,
  })
  return response.data
}

export const importDcardSource = async (
  payload: DcardSourceImportPayload
): Promise<ManualImportResponse> => {
  const response = await axiosInstance.post('/admin/related-posts/import-dcard-source', payload)
  return response.data
}

export const previewImportDcardSource = async (
  payload: Pick<DcardSourceImportPayload, 'input'>
): Promise<ManualImportPreviewResponse> => {
  const response = await axiosInstance.post('/admin/related-posts/import-dcard-source-preview', payload)
  return response.data
}

export const syncRelatedPostsFromGoogle = async (
  payload: GoogleSyncPayload
): Promise<GoogleSyncResponse> => {
  const response = await axiosInstance.post('/admin/related-posts/google-sync', payload)
  return response.data
}

export const deleteRelatedPost = async (id: number): Promise<{ success: boolean }> => {
  const response = await axiosInstance.delete(`/admin/related-posts/${id}`)
  return response.data
}

export const deleteRelatedPostImport = async (id: number): Promise<{ success: boolean }> => {
  const response = await axiosInstance.delete(`/admin/related-post-imports/${id}`)
  return response.data
}
