export interface CourseIdentity {
  cour_no: string;
  course_dep_code: string;
}

export const parseCourseIdentityFromUrl = (courseUrl?: string): CourseIdentity | null => {
  if (!courseUrl) return null;

  let params: URLSearchParams;
  try {
    params = new URL(courseUrl).searchParams;
  } catch {
    return null;
  }

  const cour_no = params.get("cour_no");
  const course_dep_code = params.get("course_dep_code");
  if (!cour_no || !course_dep_code) return null;

  return { cour_no, course_dep_code };
};
