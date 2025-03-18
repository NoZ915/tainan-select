import { useEffect, useState } from 'react';
import { useGetCourses } from '../hooks/courses/useGetCourses';
import { Course } from '../types/courseType';
import { Grid, Card, Text, Loader, Center, Pagination, Badge, Group, Container } from '@mantine/core';
import style from '../styles/pages/CoursesPage.module.css';
import CourseFilter from '../components/CourseFilter';
import { Link, useLocation, useParams } from 'react-router-dom';

const CoursesPage: React.FC = () => {
    const { search } = useLocation();
    const { page: pageParam } = useParams();
    const queryParams = new URLSearchParams(search);
    const initialSearch = queryParams.get("search") || "";
    const initialCategory = queryParams.get("category") || "all";
    const initialAcademy = queryParams.get("academy") || "";
    const initialDepartment = queryParams.get("department") || "";
    const initialCourseType = queryParams.get("courseType") || "";
    const currentPage = parseInt(pageParam || "1");
    const limit = 9;

    const [page, setPage] = useState(currentPage);
    const [searchParams, setSearchParams] = useState({
        page: currentPage,
        limit: limit,
        search: initialSearch,
        category: initialCategory,
        academy: initialAcademy,
        department: initialDepartment,
        courseType: initialCourseType
    });

    useEffect(() => {
        setSearchParams({
            page: page,
            limit: 9,
            search: initialSearch,
            category: initialCategory,
            academy: initialAcademy,
            department: initialDepartment,
            courseType: initialCourseType
        });
    }, [search, initialSearch, initialCategory, initialAcademy, initialDepartment, initialCourseType, page]);

    const { data, isLoading, isPending, error } = useGetCourses(page, limit, searchParams);

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
            <CourseFilter onSearch={setSearchParams} onClick={setPage} />

            <Grid gutter="md">
                {data?.courses.map((course: Course) => (
                    <Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
                        <Card padding="lg" className={style.courseCard}>
                            <Link to={`/course/${course.id}`} style={{ textDecoration: "none", flexGrow: 1, color: "black" }} >
                                <Text fw={500}>{course.course_name}</Text>
                                <Text fw={300} c="gray">{course.instructor}</Text>
                                <Group justify="center" mt="sm">
                                    <Badge color="brick-red.3" radius="sm">{course.academy}</Badge>
                                    <Badge color="brick-red.3" variant="light" radius="sm">{course.department}</Badge>
                                </Group>
                            </Link>
                        </Card>
                    </Grid.Col>
                ))}

                {data?.courses.length === 0 && (
                    <Container mt="md">
                        <Text c="gray">找不到符合條件的課程</Text>
                    </Container>
                )}
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

export default CoursesPage;