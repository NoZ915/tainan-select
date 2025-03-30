import { Container } from "@mantine/core";
import CourseInfoPanel from "../components/CourseInfoPanel";
import CourseReviewsPanel from "../components/CourseReviewsPanel";
import { useGetCourse } from "../hooks/courses/useGetCourse";
import { useParams } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";

const CourseDetailPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { course_id } = useParams<{ course_id: string }>();
  const { data: course, isLoading: isInfoLoading } = useGetCourse(course_id || '');

  if (isMobile) {
    return (
      <Container size="lg" mt="lg" style={{  gap: '1rem' }}>
        <div style={{ flex: '2' }}>
          <CourseInfoPanel course={course} isLoading={isInfoLoading} />
        </div>
        <div style={{ flex: '3' }}>
          <CourseReviewsPanel />
        </div>
      </Container>
    )
  }

  return (
    <Container size="lg" mt="lg" style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: '2' }}>
        <CourseInfoPanel course={course} isLoading={isInfoLoading} />
      </div>
      <div style={{ flex: '3' }}>
        <CourseReviewsPanel />
      </div>
    </Container>
  )
}

export default CourseDetailPage;