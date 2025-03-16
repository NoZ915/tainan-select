import { Course, CourseResponse, CourseSearchParams } from "../types/courseType";
import { axiosInstance } from "./axiosInstance";

export const getCourses = async ({
  page = 1,
  limit = 9,
  search,
}: {
  page?: number;
  limit?: number;
  search: CourseSearchParams;
}): Promise<CourseResponse> => {
  const filteredSearch = Object.fromEntries(
    Object.entries(search).filter(([, value]) => value !== "")
  );

  const response = await axiosInstance.get("/courses", {
    params: { page, limit, ...filteredSearch },
  });
  return response.data;
};

export const getCourse = async (course_id: string): Promise<Course | null> => {
  const response = await axiosInstance.get(`/course/${course_id}`);
  return response.data;
}

export const getDepartments = async (): Promise<{ departments: string[] }> => {
  const response = await axiosInstance.get("/courses/getAllDepartments");
  return response.data;
};

export const getAcademies = async (): Promise<{ academies: string[] }> => {
  const response = await axiosInstance.get("/courses/getAllAcademies");
  return response.data;
};
