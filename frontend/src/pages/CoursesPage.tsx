import { useState } from 'react';
import { useGetCourses } from '../hooks/courses/useGetCourses';
import { Course } from '../types/courseType';
import { Grid, Card, Text, Loader, Center, Pagination } from '@mantine/core';

const CoursePage: React.FC = () => {
    const [page, setPage] = useState(1);
    const limit = 15;

    const { data, isLoading, error } = useGetCourses(page, limit);
    console.log(data)

    if (isLoading) {
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
            {/* 課程列表 */}
            <Grid gutter="md">
                {data?.courses.map((course: Course) => (
                    <Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder>
                            <Text fw={500}>{course.course_name}</Text>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>

            {/* 分頁控制 */}
            {data?.pagination && (
                <Center mt="xl">
                    <Pagination
                        total={data.pagination.totalPages}
                        value={page}
                        onChange={setPage}
                        withEdges
                    />
                </Center>
            )}
        </div>
    );
};

export default CoursePage;