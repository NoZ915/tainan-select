import { useQuery } from '@tanstack/react-query'
import { getAllInterests } from '../../apis/interestAPI'
import { AllInterestsResponse } from '../../types/interestType'
import { QUERY_KEYS } from '../queryKeys'

const FETCH_LIMIT = 100

const fetchAllInterests = async (): Promise<AllInterestsResponse[]> => {
  const items: AllInterestsResponse[] = []
  let offset = 0
  let totalCount = 0

  do {
    const response = await getAllInterests({ pageParam: offset, limit: FETCH_LIMIT })
    items.push(...response.items)
    totalCount = response.count
    offset = items.length
  } while (items.length < totalCount)

  return items
}

export const useGetTimetableInterestOptions = (enabled: boolean) => {
  return useQuery({
    queryKey: [QUERY_KEYS.TIMETABLE_INTEREST_OPTIONS],
    queryFn: fetchAllInterests,
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  })
}
