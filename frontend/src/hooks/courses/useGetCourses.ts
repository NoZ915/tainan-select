import { useQuery } from "@tanstack/react-query";
import { getCourses } from "../../apis/courseAPI";

export const useGetCourses = (page: number, limit: number = 15, search: Record<string, string>) => {
  return useQuery({
    queryKey: ["courses", page, limit, search],
    queryFn: () => getCourses({ page, limit, search }),
    placeholderData: (prev) => prev,
  });
};
