import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteReview } from "../../apis/reviewAPI";
import { QUERY_KEYS } from "../queryKeys";

export const useDeleteReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (review_id: string) => deleteReview(review_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
        },
        onError: (err) => console.log(err)
    })
}