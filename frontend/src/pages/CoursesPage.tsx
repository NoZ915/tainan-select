import { useEffect, useMemo, useState } from 'react';
import { useGetCourses } from '../hooks/courses/useGetCourses';
import { Course } from '../types/courseType';
import { Grid, Card, Text, Loader, Center, Pagination, Badge, Group, Container } from '@mantine/core';
import style from '../styles/pages/CoursesPage.module.css';
import CourseFilter from '../components/CourseFilter';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

const CoursesPage: React.FC = () => {
    const { search } = useLocation();
    const { page: pageParam } = useParams();
    const navigate = useNavigate();

    const queryParams = useMemo(() => new URLSearchParams(search), [search]);
    const initialSearch = queryParams.get("search") || "";
    const initialCategory = queryParams.get("category") || "all";
    const initialAcademy = queryParams.get("academy") || "";
    const initialDepartment = queryParams.get("department") || "";
    const initialCourseType = queryParams.get("courseType") || "";
    const currentPage = parseInt(pageParam || "1");
    const limit = 9;

    const [page, setPage] = useState(currentPage);
    const [searchParams, setSearchParams] = useState({
        page: page,
        limit: limit,
        search: initialSearch,
        category: initialCategory,
        academy: initialAcademy,
        department: initialDepartment,
        courseType: initialCourseType
    });

    useEffect(() => {
        const updatedParams = {
            page: parseInt(queryParams.get("page") || "1", 10),
            limit: 9,
            search: queryParams.get("search") || "",
            category: queryParams.get("category") || "all",
            academy: queryParams.get("academy") || "",
            department: queryParams.get("department") || "",
            courseType: queryParams.get("courseType") || "",
        };
        setPage(updatedParams.page);
        setSearchParams(updatedParams);
    }, [queryParams]);

    const handleClickPage = (page: number) => {
        setPage(page);
        updateURL({ ...searchParams, page });
    }

    interface SearchParams {
        page: number;
        limit: number;
        search: string;
        category: string;
        academy: string;
        department: string;
        courseType: string;
    }

    // 還要研究這部分
    const updateURL = (params: SearchParams) => {
        const newQueryParams = new URLSearchParams();
        if (params.page > 1) newQueryParams.set("page", params.page.toString());
        if (params.search) newQueryParams.set("search", params.search);
        if (params.category !== "all") newQueryParams.set("category", params.category);
        if (params.academy) newQueryParams.set("academy", params.academy);
        if (params.department) newQueryParams.set("department", params.department);
        if (params.courseType) newQueryParams.set("courseType", params.courseType);

        navigate(`?${newQueryParams.toString()}`);
    };

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
            <CourseFilter
                searchParams={searchParams}
                onSearch={(params) => {
                    updateURL(params);
                }}
                onClick={setPage}
            />

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
                        onChange={(page) => handleClickPage(page)}
                    />
                </Center>
            )}
        </div>
    );
};

export default CoursesPage;