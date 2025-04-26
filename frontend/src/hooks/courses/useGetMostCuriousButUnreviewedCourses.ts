import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getMostCuriousButUnreviewedCourses } from "../../apis/courseAPI"

export const useGetMostCuriousButUnreviewedCourses = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.POPULAR_COURSES],
        queryFn: () => getMostCuriousButUnreviewedCourses()
    })
}