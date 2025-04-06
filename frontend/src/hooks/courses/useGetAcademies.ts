import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getAcademies } from "../../apis/courseAPI"

export const useGetAcademies = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACADEMIES],
        queryFn: () => getAcademies(),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
    })
}