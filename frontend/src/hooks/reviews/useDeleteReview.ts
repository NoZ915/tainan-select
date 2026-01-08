import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteReview } from '../../apis/reviewAPI'
import { QUERY_KEYS } from '../queryKeys'

export const useDeleteReview = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (review_id: number) => deleteReview(review_id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.REVIEWS] })
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INFINITY_REVIEWS] })
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LATEST_REVIEWS] })
        },
        onError: (err) => console.log(err)
    })
}