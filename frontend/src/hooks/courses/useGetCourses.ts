import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../../apis/courseAPI";

export const useGetCourses = (page: number, limit: number = 15) => {
  return useQuery({
    queryKey: ["courses", page, limit],
    queryFn: () => getCourses({ page, limit }),
    placeholderData: (prev) => prev,
  });
};
