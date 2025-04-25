import { Container, Loader, Text } from "@mantine/core";
import { useGetLatestReviews } from "../hooks/reviews/useGetLatestReiviews";
import ReviewCard from "./ReviewCard";
import styles from "../styles/components/LatestReviewsPanel.module.css"

const LatestReviewsPanel: React.FC = () => {
	const { data: latestReivews, isLoading } = useGetLatestReviews();

	if(isLoading){
		return <Loader />
	}

	return (
		<Container className={styles.container}>
			<Text size="md" fw={900} className={styles.text}>最新評價</Text>
			{latestReivews?.map((review) => {
				const formatCourse = { course: review.course }
				return (
					<ReviewCard review={review} course={formatCourse} />
				)
			})}
		</Container>
	)
}

export default LatestReviewsPanel;