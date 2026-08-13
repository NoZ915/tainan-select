import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getDepartments } from '../../apis/courseAPI'
import type { CourseOptionFilters } from '../../types/courseType'

export const useGetDepartments = (enabled = true, filters: CourseOptionFilters = {}) => {
    return useQuery({
        queryKey: [QUERY_KEYS.DEPARTMENTS, filters],
        queryFn: () => getDepartments(filters),
        enabled,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    })
}
