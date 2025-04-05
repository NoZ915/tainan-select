import { ActionIcon, Container } from "@mantine/core";
import CourseInfoPanel from "../components/CourseInfoPanel";
import CourseReviewsPanel from "../components/CourseReviewsPanel";
import { useGetCourse } from "../hooks/courses/useGetCourse";
import { useParams } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import { useGetAllReviewsByCourseId } from "../hooks/reviews/useGetAllReviewsByCourseId";
import { FaPlus } from "react-icons/fa";
import styles from "../styles/pages/CourseDetailPage.module.css";
import LoginModal from "../components/LoginModal";
import { useState } from "react";
import AddReviewModal from "../components/AddReviewModal";
import { useAuthStore } from "../stores/authStore";

const CourseDetailPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthStore();

  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [addReviewModalOpened, setAddReviewModalOpened] = useState(false);

  const { course_id } = useParams<{ course_id: string }>();
  const { data: course, isLoading: isInfoLoading } = useGetCourse(course_id || '');
  const { data: reviews, isLoading: isReviewsLoading } = useGetAllReviewsByCourseId(course_id || '');

  const handleActionClick = () => {
    if (isAuthenticated) {
      setAddReviewModalOpened(true);
    } else {
      setLoginModalOpened(true);
    }
  }

  if (isMobile) {
    return (
      <>
        <Container size="lg" mt="lg" style={{ gap: '1rem' }}>
          <div>
            <CourseInfoPanel course={course} isLoading={isInfoLoading} />
          </div>
          <div style={{ marginTop: "2rem" }}>
            <CourseReviewsPanel course={course} reviews={reviews} isLoading={isReviewsLoading} />
          </div>
          <ActionIcon
            size="xl"
            radius="xl"
            className={styles.actionIcon}
            onClick={handleActionClick}
          >
            <FaPlus size={24} />
          </ActionIcon>
        </Container>

        <LoginModal opened={loginModalOpened} onClose={() => setLoginModalOpened(false)} title="請先登入或註冊" />
        {course &&
          <AddReviewModal opened={addReviewModalOpened} onClose={() => setAddReviewModalOpened(false)} course={course} />
        }
      </>
    )
  }

  return (
    <>
      <Container size="lg" mt="lg" style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: '1' }}>
          <CourseInfoPanel course={course} isLoading={isInfoLoading} />
        </div>
        <div style={{ flex: '2' }}>
          <CourseReviewsPanel course={course} reviews={reviews} isLoading={isReviewsLoading} />
        </div>
        <ActionIcon
          size="xl"
          radius="xl"
          className={styles.actionIcon}
          onClick={handleActionClick}
        >
          <FaPlus size={24} />
        </ActionIcon>
      </Container>

      <LoginModal opened={loginModalOpened} onClose={() => setLoginModalOpened(false)} title="請先登入或註冊" />
      {course &&
        <AddReviewModal opened={addReviewModalOpened} onClose={() => setAddReviewModalOpened(false)} course={course} />
      }
    </>
  )
}

export default CourseDetailPage;