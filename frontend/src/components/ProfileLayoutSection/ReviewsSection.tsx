import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Container, Grid, Loader, Text } from "@mantine/core";
import styles from "../../styles/components/ProfileLayoutSection/ReviewsSection.module.css";
import ReviewCard from "../ReviewCard";

import { useGetAllReviewasByUserId } from "../../hooks/reviews/useGetAllReviewsByUserId";
import { useIsMobile } from "../../hooks/useIsMobile";

const ReviewsSection: React.FC = () => {
	const isMobile = useIsMobile();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage
	} = useGetAllReviewasByUserId();

	const { ref, inView } = useInView();

	useEffect(() => {
		if (inView && hasNextPage) {
			fetchNextPage();
		}
	}, [inView, fetchNextPage, hasNextPage]);

	if (isMobile) {
		return (
			<Container className={styles.container}>
				{data?.pages?.every(page => page.length === 0) && (
					<Text c="dimmed" ta="center" mt="md">
						暫無評價
					</Text>
				)}

				<Grid grow>
					{data?.pages?.map((page) =>
						page.map((review) => (
							<Grid.Col key={review.id}>
								<ReviewCard review={review} course={{ course: review.course }} />
							</Grid.Col>
						))
					)}
				</Grid>

				{/* 觀察點，準備載入下一頁 */}
				<div ref={ref} style={{ height: 1 }} />
				{isFetchingNextPage && <Loader />}
			</Container>
		)
	}

	return (
		<Container mt="md" className={styles.container}>
			<Text className={styles.title}>個人評價</Text>

			{data?.pages?.every(page => page.length === 0) && (
				<Text c="dimmed" ta="center" mt="md">
					暫無評價
				</Text>
			)}

			<Grid gutter="md" className={styles.grid} grow>
				{data?.pages?.map((page) =>
					page.map((review) => (
						<Grid.Col key={review.id}>
							<ReviewCard review={review} course={{ course: review.course }} />
						</Grid.Col>
					))
				)}
			</Grid>

			{/* 觀察點，準備載入下一頁 */}
			<div ref={ref} style={{ height: 1 }} />
			{isFetchingNextPage && <Loader />}

		</Container>
	)
}


export default ReviewsSection;