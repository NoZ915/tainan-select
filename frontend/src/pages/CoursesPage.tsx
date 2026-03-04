import { useEffect, useMemo, useState } from 'react'

import { useIsMobile } from '../hooks/useIsMobile'
import { useGetCourses } from '../hooks/courses/useGetCourses'

import { SearchParams, Course } from '../types/courseType'

import { Grid, Text, Loader, Center, Pagination, Container, Select } from '@mantine/core'
import style from '../styles/pages/CoursesPage.module.css'

import CourseFilter from '../components/CourseFilter'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import CourseCard from '../components/CourseCard'

const SORT_OPTIONS = [
	{ label: '評價數 高→低', value: 'reviewDesc' },
	{ label: '收藏數 高→低', value: 'interestDesc' },
	{ label: '觀看數 高→低', value: 'viewDesc' }
] as const

type SortByValue = typeof SORT_OPTIONS[number]['value']
type SortLabel = typeof SORT_OPTIONS[number]['label']

const DEFAULT_SORT_BY: SortByValue = 'reviewDesc'
const DEFAULT_LIMIT = 9

const getSortLabel = (sortBy?: string): SortLabel =>
	SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? SORT_OPTIONS[0].label

const getSortByValue = (label: SortLabel) =>
	SORT_OPTIONS.find((option) => option.label === label)?.value ?? DEFAULT_SORT_BY

const isSortLabel = (value: string): value is SortLabel =>
	SORT_OPTIONS.some((option) => option.label === value)

const normalizeSortBy = (value?: string): SortByValue =>
	SORT_OPTIONS.some((option) => option.value === value) ? (value as SortByValue) : DEFAULT_SORT_BY

const buildSearchParams = (queryParams: URLSearchParams): SearchParams => ({
	page: parseInt(queryParams.get('page') || '1', 10),
	limit: DEFAULT_LIMIT,
	search: queryParams.get('search') || '',
	category: queryParams.get('category') || 'all',
	academy: queryParams.get('academy') || '',
	department: queryParams.get('department') || '',
	courseType: queryParams.get('courseType') || '',
	sortBy: normalizeSortBy(queryParams.get('sortBy') || undefined)
})

const CoursesPage: React.FC = () => {
	const isMobile = useIsMobile()
	const { search } = useLocation()
	const { page: pageParam } = useParams()
	const navigate = useNavigate()

	const queryParams = useMemo(() => new URLSearchParams(search), [search])
	const currentPage = parseInt(pageParam || '1')

	const [page, setPage] = useState(currentPage)
	const [searchParams, setSearchParams] = useState(() => buildSearchParams(queryParams))

	useEffect(() => {
		const updatedCombinedSearchParams = buildSearchParams(queryParams)
		setPage(updatedCombinedSearchParams.page)
		setSearchParams(updatedCombinedSearchParams)
		setSortOption(getSortLabel(updatedCombinedSearchParams.sortBy))
	}, [queryParams])

	const handleClickPage = (page: number) => {
		setPage(page)
		updateURL({ ...searchParams, page })
	}

	// 還要研究這部分
	const updateURL = (params: SearchParams) => {
		const newQueryParams = new URLSearchParams()
		if (params.page > 1) newQueryParams.set('page', params.page.toString())
		if (params.search) newQueryParams.set('search', params.search)
		if (params.category !== 'all') newQueryParams.set('category', params.category)
		if (params.academy) newQueryParams.set('academy', params.academy)
		if (params.department) newQueryParams.set('department', params.department)
		if (params.courseType) newQueryParams.set('courseType', params.courseType)
		if (params.sortBy) newQueryParams.set('sortBy', params.sortBy)

		navigate(`?${newQueryParams.toString()}`)
	}

	// 排序功能
	const [sortOption, setSortOption] = useState(() => getSortLabel(buildSearchParams(queryParams).sortBy))
	const handleSortBy = (value: string | null) => {
		if (!value || !isSortLabel(value)) return
		const sortBy = getSortByValue(value)
		const updatedParams = { ...searchParams, sortBy, page: 1 }
		setSortOption(value)
		setPage(1)
		setSearchParams(updatedParams)
		updateURL(updatedParams)
	}

	const { data, isLoading, isPending, error } = useGetCourses(searchParams)

	if (isLoading || isPending) {
		return (
			<Center>
				<Loader />
			</Center>
		)
	}

	if (error) {
		return (
			<Center>
				<Text c='red'>Error: {(error as Error).message}</Text>
			</Center>
		)
	}

	return (
		<div>
			<CourseFilter
				searchParams={searchParams}
				onSearch={(params) => {
					updateURL(params)
				}}
				onClick={setPage}
			/>

			<div>
				<div className={style.selectContainer}>
					<Select
						value={sortOption}
						onChange={(value) => handleSortBy(value)}
						variant='unstyled'
						radius='xs'
						clearable={false}
						checkIconPosition='right'
						placeholder='排序方式'
						data={SORT_OPTIONS.map((option) => option.label)}
					/>
				</div>
				<Grid gutter='md' className={style.gridContainer}>
					{data?.courses.map((course: Course) => (
						<Grid.Col key={course.id} span={{ base: 12, sm: 6, md: 4 }}>
							<CourseCard course={course} />
						</Grid.Col>
					))}

					{data?.courses.length === 0 && (
						<Container mt='md'>
							<Text c='gray'>找不到符合條件的課程</Text>
						</Container>
					)}
				</Grid>

				{data?.pagination && (
					<Center>
						<Pagination
							classNames={{ control: style.pagination }}
							size={isMobile ? 'sm' : 'md'}
							mt='md'
							total={data.pagination.totalPages}
							value={page}
							onChange={(page) => handleClickPage(page)}
						/>
					</Center>
				)}
			</div>
		</div>
	)
}

export default CoursesPage
