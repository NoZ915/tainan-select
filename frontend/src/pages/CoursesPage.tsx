import { useEffect, useMemo, useState } from 'react';

import { useIsMobile } from '../hooks/useIsMobile';
import { useGetCourses } from '../hooks/courses/useGetCourses';

import { SearchParams, Course } from '../types/courseType';

import { Grid, Text, Loader, Center, Pagination, Container, Select } from '@mantine/core';
import style from '../styles/pages/CoursesPage.module.css';

import CourseFilter from '../components/CourseFilter';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CourseCard from '../components/CourseCard';

const CoursesPage: React.FC = () => {
	const isMobile = useIsMobile();
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
		courseType: initialCourseType,
		sortBy: ""
	});

	useEffect(() => {
		const updatedCombinedSearchParams = {
			page: parseInt(queryParams.get("page") || "1", 10),
			limit: 9,
			search: queryParams.get("search") || "",
			category: queryParams.get("category") || "all",
			academy: queryParams.get("academy") || "",
			department: queryParams.get("department") || "",
			courseType: queryParams.get("courseType") || "",
			sortBy: ""
		};
		setPage(updatedCombinedSearchParams.page);
		setSearchParams(updatedCombinedSearchParams);
		setSortOption("評價數 高→低");
	}, [queryParams]);

	const handleClickPage = (page: number) => {
		setPage(page);
		updateURL({ ...searchParams, page });
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

	// 排序功能
	const [sortOption, setSortOption] = useState("評價數 高→低");
	const handleSortBy = (value: string | null) => {
		if(!value) return;
		setSortOption(value);

		switch(value){
			case "評價數 高→低":
				setSearchParams({...searchParams, sortBy: "reviewDesc"});
				break;
			case "收藏數 高→低":
				setSearchParams({...searchParams, sortBy: "interestDesc"});
				break;
			case "觀看數 高→低":
				setSearchParams({...searchParams, sortBy: "viewDesc"});
				break;
		}
	}

	const { data, isLoading, isPending, error } = useGetCourses(searchParams);

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

			<div>
				<div className={style.selectContainer}>
					<Select
						value={sortOption}
						onChange={(value) => handleSortBy(value)}
						variant="unstyled"
						radius="xs"
						clearable={false}
						checkIconPosition="right"
						placeholder="排序方式"
						defaultValue="評價數 高→低"
						data={["評價數 高→低", "收藏數 高→低", "觀看數 高→低"]}
					/>
				</div>
				<Grid gutter="md" className={style.gridContainer}>
					{data?.courses.map((course: Course) => (
						<Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
							<CourseCard course={course} />
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
							size={isMobile ? "sm" : "md"}
							mt="md"
							total={data.pagination.totalPages}
							value={page}
							onChange={(page) => handleClickPage(page)}
						/>
					</Center>
				)}
			</div>
		</div>
	);
};

export default CoursesPage;