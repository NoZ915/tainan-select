import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toggleInterest } from "../../apis/interestAPI"
import { ToggleInterestResult } from "../../types/interestType";
import { QUERY_KEYS } from "../queryKeys";

export const useToggleInterest = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (course_id: number) => toggleInterest(course_id),
		onSuccess: (data) => {
			queryClient.setQueryData([QUERY_KEYS.COURSE], (oldData: ToggleInterestResult) => ({
				...oldData,
				hasUserAddInterest: data.isInterest
			}))
		}
	})
}