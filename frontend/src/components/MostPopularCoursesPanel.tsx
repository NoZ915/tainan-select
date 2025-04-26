import { Container, Grid, Loader, Text } from "@mantine/core";
import { useGetMostCuriousButUnreviewedCourses } from "../hooks/courses/useGetMostCuriousButUnreviewedCourses";
import CourseCard from "./CourseCard";
import styles from "../styles/components/MostPopularCoursesPanel.module.css"

const MostPopularCoursesPanel: React.FC = () => {
  const { data: popularCourses, isLoading } = useGetMostCuriousButUnreviewedCourses();

  if (isLoading) {
    return <Loader />
  }

  return (
    <Container className={styles.container}>
      <Text size="md" fw={900} className={styles.text}>Tainan選，求評價</Text>
      <Grid gutter="md" className={styles.grid}>
        {popularCourses && popularCourses.map((course) => (
          <Grid.Col key={course.id} span={{ base: 12, sm: 6 }}>
            <CourseCard course={course} />
          </Grid.Col>
        ))}
      </Grid>
    </Container>

  );
}

export default MostPopularCoursesPanel;