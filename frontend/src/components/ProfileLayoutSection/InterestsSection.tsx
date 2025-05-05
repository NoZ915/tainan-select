import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { Container, Grid, Loader, Text } from "@mantine/core";
import styles from "../../styles/components/ProfileLayoutSection/InterestsSection.module.css";

import { useGetAllInterests } from "../../hooks/interests/useGetAllInterests";
import CourseCard from "../CourseCard";

const InterestsSection: React.FC = () => {
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

	return (
		<Container mt="md">
			<Text className={styles.title}>個人收藏</Text>
			<div className={styles.interests}>
				<Grid gutter="md" className={styles.grid}>
					{data?.pages.flat()?.map((interest) => {
						return (
							<Grid.Col key={interest.id} span={{ base: 12 }}>
								<CourseCard course={interest.course} />
							</Grid.Col>
						)
					})}
				</Grid>

				{/* 觀察點，準備載入下一頁 */}
				<div ref={ref} style={{ height: 1 }} />
				{isFetchingNextPage && <Loader />}
			</div>
		</Container>
	)
}

export default InterestsSection;