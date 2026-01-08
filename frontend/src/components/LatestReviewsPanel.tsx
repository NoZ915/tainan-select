import { Container, Grid, Loader, Text } from '@mantine/core'
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
				<Grid >
					{
						latestReivews?.map((review) => (
							<Grid.Col key={review.id} span={{ base: 12 }} className={styles.gridCol}>
								<ReviewCard
									review={review}
									course={{ course: review.course }}
								/>
							</Grid.Col>
						))
					}
				</Grid>

			)}

		</Container>
	)
}

export default LatestReviewsPanel