import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../../apis/courseAPI";
import { CourseSearchParams } from "../../types/courseType";

export const useGetCourses = (page: number, limit: number = 15, search: CourseSearchParams) => {
  return useQuery({
    queryKey: ["courses", page, limit, search],
    queryFn: () => getCourses({ page, limit, search }),
    placeholderData: (prev) => prev,
  });
};
