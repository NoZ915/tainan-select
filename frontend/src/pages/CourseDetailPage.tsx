import { useState } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useGetCourse } from "../hooks/courses/useGetCourse";
import { useIsMobile } from "../hooks/useIsMobile";
import { useGetAllReviewsByCourseId } from "../hooks/reviews/useGetAllReviewsByCourseId";

import { ActionIcon, Container, Tooltip } from "@mantine/core";
import CourseInfoPanel from "../components/CourseInfoPanel";
import CourseReviewsPanel from "../components/CourseReviewsPanel";
import AddOrEditReviewModal from "../components/AddOrEditReviewModal";
import LoginModal from "../components/LoginModal";

import { FaPlus } from "react-icons/fa";
import styles from "../styles/pages/CourseDetailPage.module.css";

const CourseDetailPage: React.FC = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated } = useAuthStore();

  const [loginModalOpened, setLoginModalOpened] = useState(false);
  const [AddOrEditReviewModalOpened, setAddOrEditReviewModalOpened] = useState(false);

  const { course_id } = useParams<{ course_id: string }>();
  const { data: course, isLoading: isInfoLoading } = useGetCourse(course_id || '');
  const { data: reviews, isLoading: isReviewsLoading } = useGetAllReviewsByCourseId(course_id || '');

  const handleActionClick = () => {
    if (isAuthenticated) {
      setAddOrEditReviewModalOpened(true);
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
            disabled={course && reviews?.hasUserReviewedCourse}
          >
            <FaPlus size={24} />
          </ActionIcon>
        </Container>

        <LoginModal opened={loginModalOpened} onClose={() => setLoginModalOpened(false)} title="請先登入或註冊" />
        {course &&
          <AddOrEditReviewModal opened={AddOrEditReviewModalOpened} onClose={() => setAddOrEditReviewModalOpened(false)} course={course} review={null} />
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
        <Tooltip
          label={course && reviews?.hasUserReviewedCourse ? "已經對這門課程發表過評價，請直接編輯評價" : "新增評價"}
          position="top"
        >
          <ActionIcon
            size="xl"
            radius="xl"
            className={styles.actionIcon}
            onClick={handleActionClick}
            disabled={course && reviews?.hasUserReviewedCourse}  // 根據 hasUserReviewedCourse 禁用
          >
            <FaPlus size={24} />
          </ActionIcon>
        </Tooltip>
      </Container>

      <LoginModal opened={loginModalOpened} onClose={() => setLoginModalOpened(false)} title="請先登入或註冊" />
      {course &&
        <AddOrEditReviewModal opened={AddOrEditReviewModalOpened} onClose={() => setAddOrEditReviewModalOpened(false)} course={course} review={null} />
      }
    </>
  )
}

export default CourseDetailPage;