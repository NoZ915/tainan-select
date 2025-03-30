import { Container } from "@mantine/core";
import CourseInfoPanel from "../components/CourseInfoPanel";
import CourseReviewsPanel from "../components/CourseReviewsPanel";
import { useGetCourse } from "../hooks/courses/useGetCourse";
import { useParams } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { useGetAllReviewsByCourseId } from "../hooks/reviews/useGetAllReviewsByCourseId";

const CourseDetailPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { course_id } = useParams<{ course_id: string }>();
  const { data: course, isLoading: isInfoLoading } = useGetCourse(course_id || '');
  const { data: reviews, isLoading: isReviewsLoading } = useGetAllReviewsByCourseId(course_id || '');

  if (isMobile) {
    return (
      <Container size="lg" mt="lg" style={{  gap: '1rem' }}>
        <div>
          <CourseInfoPanel course={course} isLoading={isInfoLoading} />
        </div>
        <div style={{ marginTop: "2rem" }}>
          <CourseReviewsPanel course={course} reviews={reviews} isLoading={isReviewsLoading}/>
        </div>
      </Container>
    )
  }

  return (
    <Container size="lg" mt="lg" style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: '1' }}>
        <CourseInfoPanel course={course} isLoading={isInfoLoading} />
      </div>
      <div style={{ flex: '2' }}>
        <CourseReviewsPanel course={course} reviews={reviews} isLoading={isReviewsLoading} />
      </div>
    </Container>
  )
}

export default CourseDetailPage;