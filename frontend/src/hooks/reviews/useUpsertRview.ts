import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UpsertReviewInput } from '../../types/reviewType'
import { upsertReview } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useUpsertReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: UpsertReviewInput) => upsertReview(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_REVIEWS] })
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LATEST_REVIEWS] })
        },
        onError: (err) => console.log(err)
    })
}