import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getMostPopularCourses } from "../../apis/courseAPI"

export const useGetMostPopularCourses = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.POPULAR_COURSES],
        queryFn: () => getMostPopularCourses()
    })
}