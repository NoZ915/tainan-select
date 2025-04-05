import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateReviewInput } from "../../types/reviewType";
import { createReview } from "../../apis/reviewAPI";
import { QUERY_KEYS } from "../queryKeys";

export const useCreateReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateReviewInput) => createReview(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
        },
        onError: (err) => console.log(err)
    })
}