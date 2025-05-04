import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getAllInterests } from "../../apis/interestAPI"

export const useGetAllInterests = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.INTERESTS],
        queryFn: () => getAllInterests(),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,
        refetchOnWindowFocus: false,
    })
}