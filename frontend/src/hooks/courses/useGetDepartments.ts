import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getDepartments } from "../../apis/courseAPI"

export const useGetDepartments = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.DEPARTMENTS],
        queryFn: () => getDepartments()
    })
}