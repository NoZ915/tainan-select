import { Container, Grid, Text } from "@mantine/core";
import CourseCard from "../CourseCard";

const ReviewsSection: React.FC = () => {
	return (
		<Container mt="md">
			{/* <Text className={styles.title}>個人收藏</Text>
			<div className={styles.interests}>
				<Grid gutter="md" className={styles.grid}>
					{allInterests?.map((interest) => {
						return (
							<Grid.Col key={interest.id} span={{ base: 12 }}>
								<CourseCard course={interest.course} />
							</Grid.Col>
						)
					})}
				</Grid>
			</div> */}
		</Container>
	)
}

export default ReviewsSection;