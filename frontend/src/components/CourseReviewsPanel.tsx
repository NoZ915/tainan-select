import { Avatar, Box, Card, Container, Group, Rating, Text } from "@mantine/core";
import styles from "../styles/components/CourseReviewsPanel.module.css";
import { Review } from "../types/reviewType";
import { Course } from "../types/courseType";

interface CourseReviewsPanelProps {
	course: { course: Course } | null | undefined;
	reviews: Review[] | undefined;
	isLoading: boolean;
}

const CourseReviewsPanel: React.FC<CourseReviewsPanelProps> = ({ course, reviews, isLoading }) => {
	if (isLoading) {
		return <>Is Loading...</>
	}

	if (!reviews) {
		return <>There are no reviews.</>;
	}

	return (
		<Container className={styles.container}>
			{reviews.map((review) => {
				return (
					<Card key={review.id} className={styles.card}>
						<Card.Section className={styles.cardSection}>
							<Group>
								<Avatar variant="light" size="lg" color="brick-red.6" src="" />
								<Box>
									<Text>{review.UserModel.name}</Text>
									<Text>{new Date(review.updated_at).toLocaleString()}</Text>
								</Box>
							</Group>
						</Card.Section>

						<Card.Section className={styles.cardSection}>
							<Text size="md" fw={900} className={styles.courseName}>
								{course?.course.course_name} / {course?.course.instructor}
							</Text>
						</Card.Section>

						<Card.Section className={styles.cardSection}>
							<Group>
								<Text>收穫</Text>
								<Rating defaultValue={review.gain} color="brick-red.6" size="md" fractions={2} readOnly></Rating>

								<Text>甜度</Text>
								<Rating defaultValue={review.sweetness} color="brick-red.6" size="md" fractions={2} readOnly></Rating>

								<Text>涼度</Text>
								<Rating defaultValue={review.coolness} color="brick-red.6" size="md" fractions={2} readOnly></Rating>
							</Group>
						</Card.Section>

						<Card.Section className={styles.cardSection}>
							<Text>{review.comment}</Text>
						</Card.Section>
					</Card>
				)
			})}
		</Container>
	)
}

export default CourseReviewsPanel;