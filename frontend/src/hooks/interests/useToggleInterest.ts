import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toggleInterest } from "../../apis/interestAPI"
import { ToggleInterestResult } from "../../types/interestType";
import { QUERY_KEYS } from "../queryKeys";

export const useToggleInterest = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (course_id: string) => toggleInterest(course_id),
        onSuccess: (data, course_id) => {
            queryClient.setQueryData([QUERY_KEYS.COURSE, course_id], (oldData: ToggleInterestResult) => ({
                ...oldData,
                isInterest: data.isInterest,
            }))
        }
    })
}