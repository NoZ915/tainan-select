import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getLatestReviews } from "../../apis/reviewAPI"

export const useGetLatestReviews = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.LATEST_REVIEWS],
        queryFn: () => getLatestReviews()
    })
}