import { Container, Loader } from '@mantine/core'
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
    return <>尚無評論</>
  }

  return (
    <Container className={styles.container}>
      {reviews.reviews.map((review) => {
        return (
          <ReviewCard key={review.id} review={review} course={course} />
        )
      })}
    </Container>
  )
}

export default CourseReviewsPanel