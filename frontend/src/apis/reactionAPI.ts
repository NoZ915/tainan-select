import { ReactionPreset } from '../types/reactionType'
import { axiosInstance } from './axiosInstance'

export const getReactionPresets = async (): Promise<{ items: ReactionPreset[] }> => {
  const response = await axiosInstance.get('/reactions/presets')
  return response.data
}
