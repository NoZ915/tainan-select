import { useState } from 'react';
import { useGetCourses } from '../hooks/courses/useGetCourses';
import { Course } from '../types/courseType';
import { Grid, Card, Text, Loader, Center, Pagination, Badge, Group } from '@mantine/core';
import style from '../styles/pages/CoursesPage.module.css';
import CourseFilter from '../components/CourseFilter';

const CoursePage: React.FC = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 15;

    const { data, isLoading, isPending, error } = useGetCourses(page, limit, search);

    if (isLoading || isPending) {
        return (
            <Center>
                <Loader />
            </Center>
        );
    }

    if (error) {
        return (
            <Center>
                <Text c="red">Error: {(error as Error).message}</Text>
            </Center>
        );
    }

    return (
        <div>
            <CourseFilter onSearch={setSearch} />

            <Grid gutter="md">
                {data?.courses.map((course: Course) => (
                    <Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card padding="lg" className={style.courseCard}>
                            <Text fw={500}>{course.course_name}</Text>
                            <Text fw={300} c="gray">{course.instructor}</Text>
                            <Group justify="center" mt="sm">
                                <Badge color="brick-red.3" radius="sm">{course.academy}</Badge>
                                <Badge color="brick-red.3" variant="light" radius="sm">{course.department}</Badge>
                            </Group>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>

            {data?.pagination && (
                <Center>
                    <Pagination
                        classNames={{ control: style.pagination }}
                        mt="md"
                        total={data.pagination.totalPages}
                        value={page}
                        onChange={setPage}

                    />
                </Center>
            )}
        </div>
    );
};

export default CoursePage;