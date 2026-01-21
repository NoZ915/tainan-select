import { useMemo } from 'react'

import { Button, Container, Grid, Group, Loader, Text } from '@mantine/core'
import styles from '../../styles/components/ProfileLayoutSection/ReviewsSection.module.css'
import ReviewCard from '../ReviewCard'

import { useGetAllReviewsByUserId } from '../../hooks/reviews/useGetAllReviewsByUserId'

const ReviewsSection: React.FC = () => {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useGetAllReviewsByUserId()

	const reviews = useMemo(() => data?.pages?.flat() ?? [], [data])

	return (
		<Container className={styles.container}>
			{isLoading ? (
				<Group justify='center'>
					<Loader />
				</Group>
			) : reviews.length === 0 ? (
				<Text c='dimmed' ta='center' mt='md'>
            暫無評價
				</Text>
			) : (
				<Grid gutter='md' className={styles.grid} grow>
					{reviews.map((review) => (
						<Grid.Col key={review.id} span={{ base: 12, md: 6 }}>
							<ReviewCard review={review} course={{ course: review.course }} />
						</Grid.Col>
					))}
				</Grid>
			)}

			{hasNextPage && (
				<Group justify='center' mt='lg'>
					<Button variant='light' onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
						載入更多
					</Button>
				</Group>
			)}
		</Container>
	)
}

export default ReviewsSection
