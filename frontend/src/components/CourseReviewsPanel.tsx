import { Container, Loader, Text } from '@mantine/core'
import styles from '../styles/components/CourseReviewsPanel.module.css'

import { ReviewsResponse } from '../types/reviewType'
import { Course } from '../types/courseType'

import ReviewCard from './ReviewCard'

interface CourseReviewsPanelProps {
  course: { course: Course } | null | undefined;
  reviews: { reviews: ReviewsResponse[], hasUserReviewedCourse: boolean } | undefined;
  isLoading: boolean;
}

const CourseReviewsPanel: React.FC<CourseReviewsPanelProps> = ({ course, reviews, isLoading }) => {
  if (isLoading) {
    return <Loader />
  }

  if (!reviews || !Array.isArray(reviews.reviews) || reviews.reviews.length === 0) {
    return (
      <Container className={styles.container}>
        <Text fw={900} className={styles.heading}>使用者評價</Text>
        <Text c='dimmed'>尚無評論</Text>
      </Container>
    )
  }

  return (
    <Container className={styles.container}>
      <Text fw={900} className={styles.heading}>使用者評價</Text>
      {reviews.reviews.map((review) => {
        return (
          <ReviewCard key={review.id} review={review} course={course} />
        )
      })}
    </Container>
  )
}

export default CourseReviewsPanel
