import { useInfiniteQuery } from "@tanstack/react-query"
import { QUERY_KEYS } from "../queryKeys"
import { getAllInterests } from "../../apis/interestAPI"

export const useGetAllInterests = () => {
    return useInfiniteQuery({
        queryKey: [QUERY_KEYS.INTERESTS],
        queryFn: getAllInterests,
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            const nextOffset = allPages.length * 10; // allPages是一個陣列，每個元素代表一頁的資料，所以allPages.length 表示目前已經獲取的頁數
            return lastPage.length < 10 ? undefined : nextOffset; // 如果最後一頁所包含的資料長度小於10，表示沒有下一頁了
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 60,

    })
}