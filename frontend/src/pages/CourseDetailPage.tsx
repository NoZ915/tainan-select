import { Container } from "@mantine/core";
import CourseInfoPanel from "../components/CourseInfoPanel";
import CourseReviewsPanel from "../components/CourseReviewsPanel";

const CourseDetailPage: React.FC = () => {
  return (
    <Container size="lg" style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ flex: '1' }}>
        <CourseInfoPanel />
      </div>
      <div style={{ flex: '2' }}>
        <CourseReviewsPanel />
      </div>
    </Container>
  )
}

export default CourseDetailPage;