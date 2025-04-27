import { useQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getAllInterests } from "../../apis/interestAPI"

export const useGetAllInterests = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.INTERESTS],
        queryFn: () => getAllInterests()
    })
}