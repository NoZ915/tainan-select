import { Course } from "../types/courseType";

interface CourseInfoPanelProps {
  course: Course | null | undefined;
  isLoading: boolean;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ course, isLoading }) => {
  
  if(isLoading){
    return <>Is Loading...</>
  }
  
  return (
    <>{course?.course_name}</>
  )
}

export default CourseInfoPanel;