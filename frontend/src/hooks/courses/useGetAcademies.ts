import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getAcademies } from "../../apis/courseAPI"

export const useGetAcademies = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.ACADEMIES],
        queryFn: () => getAcademies()
    })
}