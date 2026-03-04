import { Container, Loader, Stack, Text } from '@mantine/core'
import { useGetLatestReviews } from '../hooks/reviews/useGetLatestReiviews'
import ReviewCard from './ReviewCard'
import styles from '../styles/components/LatestReviewsPanel.module.css'

const LatestReviewsPanel: React.FC = () => {
	const { data: latestReivews, isLoading } = useGetLatestReviews()

	return (
		<Container className={styles.container}>
			<Text size='md' fw={900} className={styles.text}>最新評價</Text>

			{isLoading ? (
				<Loader />
			) : (
				<Stack gap='1rem' className={styles.list}>
					{latestReivews?.map((review) => (
						<ReviewCard
							key={review.id}
							review={review}
							course={{ course: review.course }}
						/>
					))}
				</Stack>

			)}

		</Container>
	)
}

export default LatestReviewsPanel
