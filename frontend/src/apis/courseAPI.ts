import { Course, CourseResponse, SearchParams } from "../types/courseType";
import { axiosInstance } from "./axiosInstance";

export const getCourses = async (searchParams: SearchParams): Promise<CourseResponse> => {
  const filteredSearchParams = Object.fromEntries(
    Object.entries(searchParams).filter(([, value]) => value !== "")
  );
  const queryParams = new URLSearchParams({ ...filteredSearchParams }).toString();
  const response = await axiosInstance.get(`/courses?${queryParams}`);
  return response.data;
};

export const getCourse = async (course_id: string): Promise<{ course: Course, hasUserReviewedCourse: boolean }> => {
  const response = await axiosInstance.get(`/courses/${course_id}`);
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
