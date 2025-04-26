import { useMutation } from "@tanstack/react-query"
import { addViewCount } from "../../apis/courseAPI";

export const useAddViewCount = () => {
    return useMutation({
        mutationFn: (course_id: string) => addViewCount(course_id),
        onError: (err) => console.log(err)
    })
}