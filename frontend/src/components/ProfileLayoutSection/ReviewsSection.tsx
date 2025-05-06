import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Container, Grid, Loader, Text } from "@mantine/core";
import styles from "../../styles/components/ProfileLayoutSection/ReviewsSection.module.css";
import ReviewCard from "../ReviewCard";

import { useGetAllReviewasByUserId } from "../../hooks/reviews/useGetAllReviewsByUserId";

const ReviewsSection: React.FC = () => {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useGetAllReviewasByUserId();

	const { ref, inView } = useInView();

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, fetchNextPage, hasNextPage]);

	return (
		<Container mt="md" className={styles.container}>
			<Text className={styles.title}>個人收藏</Text>

			{data?.pages.flat().length === 0 && (
				<Text c="dimmed" ta="center" mt="md">
					暫無收藏
				</Text>
			)}

			<Grid gutter="md" className={styles.grid} grow>
				{data?.pages.flat()?.map((review) => {
					return (
						<Grid.Col key={review.id}>
							<ReviewCard review={review} course={{ course: review.course }} />
						</Grid.Col>
					)
				})}
			</Grid>

			{/* 觀察點，準備載入下一頁 */}
			<div ref={ref} style={{ height: 1 }} />
			{isFetchingNextPage && <Loader />}

		</Container>
	)
}


export default ReviewsSection;