import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Container, Grid, Loader, Text } from "@mantine/core";
import styles from "../../styles/components/ProfileLayoutSection/InterestsSection.module.css";

import { useGetAllInterests } from "../../hooks/interests/useGetAllInterests";
import CourseCard from "../CourseCard";
import { useIsMobile } from "../../hooks/useIsMobile";

const InterestsSection: React.FC = () => {
	const isMobile = useIsMobile();

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useGetAllInterests();

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
						暫無收藏
					</Text>
				)}

				<Grid gutter="md" className={styles.grid} grow>
					{data?.pages?.map((page) =>
						page.map((interest) => (
							<Grid.Col key={interest.id}>
								<CourseCard course={interest.course} />
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
			<Text className={styles.title}>個人收藏</Text>

			{data?.pages?.every(page => page.length === 0) && (
				<Text c="dimmed" ta="center" mt="md">
					暫無收藏
				</Text>
			)}

			<Grid gutter="md" className={styles.grid} grow>
				{data?.pages?.map((page) =>
					page.map((interest) => (
						<Grid.Col key={interest.id}>
							<CourseCard course={interest.course} />
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

export default InterestsSection;