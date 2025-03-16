import { Container } from "@mantine/core";
import CourseInfoPanel from "../components/CourseInfoPanel";
import CourseReviewsPanel from "../components/CourseReviewsPanel";
import { useGetCourse } from "../hooks/courses/useGetCourse";
import { useParams } from "react-router-dom";

const CourseDetailPage: React.FC = () => {
  const { course_id } = useParams<{ course_id: string }>();
  console.log(course_id)
  const { data: course, isLoading: isInfoLoading } = useGetCourse(course_id || '');

  return (
    <Container size="lg" style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: '1' }}>
        <CourseInfoPanel course={course} isLoading={isInfoLoading} />
      </div>
      <div style={{ flex: '2' }}>
        <CourseReviewsPanel />
      </div>
    </Container>
  )
}

export default CourseDetailPage;