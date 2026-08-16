import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '../queryKeys'
import { getClassNames } from '../../apis/courseAPI'
import type { CourseOptionFilters } from '../../types/courseType'

export const useGetClassNames = (enabled = true, filters: CourseOptionFilters = {}) => {
    return useQuery({
        queryKey: [QUERY_KEYS.CLASS_NAMES, filters],
        queryFn: () => getClassNames(filters),
        enabled,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    })
}
