import { Course } from "../types/courseType";

interface CourseInfoPanelProps {
  course: { course: Course } | null | undefined;
  isLoading: boolean;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ course, isLoading }) => {
  
  if(isLoading){
    return <>Is Loading...</>
  }

  if (!course) {
    return <>Course information is not available.</>;
  }

  return (
    <>
    <h2>{course.course.course_name}</h2>
    <p>{course.course.academy}</p>
  </>
  )
}

export default CourseInfoPanel;