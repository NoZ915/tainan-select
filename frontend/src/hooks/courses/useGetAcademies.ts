import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getAcademies } from '../../apis/courseAPI'
import type { CourseOptionFilters } from '../../types/courseType'

export const useGetAcademies = (enabled = true, filters: CourseOptionFilters = {}) => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACADEMIES, filters],
        queryFn: () => getAcademies(filters),
        enabled,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    })
}
