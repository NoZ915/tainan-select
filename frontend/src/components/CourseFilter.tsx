import { useEffect, useRef, useState } from 'react'
import { Container, Tabs, Input, Button, Select, MultiSelect, Accordion, Group } from '@mantine/core'
import { SearchParams, FilterOption } from '../types/courseType'
import { FaSearch } from 'react-icons/fa'
import style from '../styles/components/CourseFilter.module.css'
import { useGetDepartments } from '../hooks/courses/useGetDepartments'
import { useGetAcademies } from '../hooks/courses/useGetAcademies'
import { useGetClassNames } from '../hooks/courses/useGetClassNames'
import { useGetSemesters } from '../hooks/semesters/useGetSemesters'
import periodTimeMap from '../utils/periodTimeMap'

const GRADE_OPTIONS = [
    { value: '1', label: '一' },
    { value: '2', label: '二' },
    { value: '3', label: '三' },
    { value: '4', label: '四' },
]
const GRADUATE_LEVEL_OPTIONS = [
    { value: '碩一', label: '碩一' },
    { value: '碩二以上', label: '碩二（以上）' },
    { value: '博一', label: '博一' },
    { value: '博二以上', label: '博二（以上）' },
]

interface CourseFilterProps {
    searchParams: SearchParams;
    onSearch: (searchParams: SearchParams, options?: { replace?: boolean }) => void;
    onClick: (page: number) => void;
};

const CourseFilter: React.FC<CourseFilterProps> = ({ searchParams, onSearch, onClick }) => {
    const onSearchRef = useRef(onSearch)
    const [searchText, setSearchText] = useState(searchParams.search)
    const [activeTab, setActiveTab] = useState(searchParams.category)
    const [academy, setAcademy] = useState(searchParams.academy)
    const [department, setDepartment] = useState(searchParams.department)
    const [courseType, setCourseType] = useState(searchParams.courseType)
    const [weekdays, setWeekdays] = useState<string[]>(searchParams.weekdays)
    const [periods, setPeriods] = useState<string[]>(searchParams.periods)
    const [semesters, setSemesters] = useState<string[]>(searchParams.semesters)
    const [grades, setGrades] = useState<string[]>(searchParams.grades)
    const [graduateLevels, setGraduateLevels] = useState<string[]>(searchParams.graduateLevels)
    const [classNames, setClassNames] = useState<string[]>(searchParams.classNames)
    const [advancedAccordionValue, setAdvancedAccordionValue] = useState<string | null>(null)

    useEffect(() => {
        onSearchRef.current = onSearch
    }, [onSearch])

    useEffect(() => {
        setSearchText(searchParams.search)
        setActiveTab(searchParams.category)
        setAcademy(searchParams.academy)
        setDepartment(searchParams.department)
        setCourseType(searchParams.courseType)
        setWeekdays(searchParams.weekdays)
        setPeriods(searchParams.periods)
        setSemesters(searchParams.semesters)
        setGrades(searchParams.grades)
        setGraduateLevels(searchParams.graduateLevels)
        setClassNames(searchParams.classNames)
    }, [searchParams])

    const filterOptions: FilterOption[] = [
        { label: '全部', value: 'all' },
        { label: '通識', value: 'general' },
        { label: '大學', value: 'university' },
        { label: '研究所', value: 'graduate' },
        { label: '師培', value: 'teacher' },
        { label: 'EWANT', value: 'ewant' },
    ]
    const showOrganizationFilters = activeTab === 'university' || activeTab === 'graduate'
    const optionSemesterFilter = semesters.length > 0 ? semesters.join(',') : undefined
    const { data: departmentList, isLoading: isLoadingDepartments } = useGetDepartments(
        showOrganizationFilters,
        {
            semester: optionSemesterFilter,
            category: activeTab,
            academy: academy || undefined,
        },
    )
    const { data: academyList, isLoading: isLoadingAcademies } = useGetAcademies(
        showOrganizationFilters,
        {
            semester: optionSemesterFilter,
            category: activeTab,
        },
    )
    const { data: classNameList, isLoading: isLoadingClassNames } = useGetClassNames(
        activeTab === 'teacher',
        { category: activeTab },
    )
    const { data: semesterList } = useGetSemesters()
    const showCourseTypeFilter = activeTab === 'university' || activeTab === 'graduate' || activeTab === 'teacher'
    const organizationOptionContextMatchesUrl = activeTab === searchParams.category
        && semesters.join(',') === searchParams.semesters.join(',')

    useEffect(() => {
        if (!showOrganizationFilters) {
            if (!academy && !department) return

            setAcademy('')
            setDepartment('')
            if (
                organizationOptionContextMatchesUrl
                && (searchParams.academy || searchParams.department)
            ) {
                onSearchRef.current(
                    {
                        ...searchParams,
                        page: 1,
                        academy: '',
                        department: '',
                    },
                    { replace: true },
                )
            }
            return
        }

        if (
            academy
            && !isLoadingAcademies
            && academyList
            && !academyList.academies.includes(academy)
        ) {
            setAcademy('')
            setDepartment('')
            if (
                organizationOptionContextMatchesUrl
                && (searchParams.academy || searchParams.department)
            ) {
                onSearchRef.current(
                    {
                        ...searchParams,
                        page: 1,
                        academy: '',
                        department: '',
                    },
                    { replace: true },
                )
            }
            return
        }

        if (
            department
            && !isLoadingDepartments
            && departmentList
            && !departmentList.departments.includes(department)
        ) {
            setDepartment('')
            if (organizationOptionContextMatchesUrl && searchParams.department) {
                onSearchRef.current(
                    {
                        ...searchParams,
                        page: 1,
                        department: '',
                    },
                    { replace: true },
                )
            }
        }
    }, [
        academy,
        academyList,
        department,
        departmentList,
        isLoadingAcademies,
        isLoadingDepartments,
        organizationOptionContextMatchesUrl,
        searchParams,
        showOrganizationFilters,
    ])

    const weekdayOptions = [
        { value: '1', label: '星期一' },
        { value: '2', label: '星期二' },
        { value: '3', label: '星期三' },
        { value: '4', label: '星期四' },
        { value: '5', label: '星期五' },
        { value: '6', label: '星期六' },
        { value: '7', label: '星期日' },
    ]
    const periodOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G']
        .map((period) => ({ value: period, label: `第${period}節（${periodTimeMap[period] ?? ''}）` }))
    const semesterOptions = (semesterList?.items ?? []).map((semester) => ({ value: semester, label: semester }))
    const weekdayLabelMap: Record<string, string> = {
        '1': '一',
        '2': '二',
        '3': '三',
        '4': '四',
        '5': '五',
        '6': '六',
        '7': '日',
    }
    const advancedSummaryParts: string[] = []
    if (weekdays.length > 0) advancedSummaryParts.push(`週${weekdays.map((day) => weekdayLabelMap[day] ?? day).join('、')}`)
    if (periods.length > 0) {
        const periodSummary = periods
            .map((period) => `第${period}節（${periodTimeMap[period] ?? ''}）`)
            .join('、')
        advancedSummaryParts.push(`節次 ${periodSummary}`)
    }
    if (semesters.length > 0) advancedSummaryParts.push(`學期 ${semesters.join('、')}`)
    const advancedSummaryText = advancedSummaryParts.length > 0 ? advancedSummaryParts.join('｜') : '未設定'

    const handleTabChange = (value: string) => {
        setSearchText('')
        setActiveTab(value ?? 'all')
        setAcademy('')
        setDepartment('')
        setCourseType('')
        setWeekdays([])
        setPeriods([])
        setSemesters([])
        setGrades([])
        setGraduateLevels([])
        setClassNames([])
        onSearch({
            page: 1,
            limit: 9,
            search: '',
            category: value,
            academy: '',
            department: '',
            courseType: '',
            weekdays: [],
            periods: [],
            semesters: [],
            grades: [],
            graduateLevels: [],
            classNames: [],
            sortBy: searchParams.sortBy || 'reviewDesc',
        })
    }
    const handleClick = () => {
        onClick(1)
        onSearch({
            page: 1,
            limit: 9,
            search: searchText,
            category: activeTab,
            academy,
            department,
            courseType,
            weekdays,
            periods,
            semesters,
            grades,
            graduateLevels,
            classNames,
            sortBy: searchParams.sortBy || 'reviewDesc',
        })
    }

    return (
        <Container key={activeTab} className={style.container}>
            <Tabs value={activeTab} className={style.tabs} classNames={{ tab: style.tab }} onChange={(value: string | null) => handleTabChange(value ?? 'all')}>
                <Tabs.List justify='center' className={style.tabsList}>
                    {filterOptions.map((option) => {
                        return (
                            <Tabs.Tab key={option.value} value={option.value} fw={500}>
                                {option.label}
                            </Tabs.Tab>
                        )
                    })}
                </Tabs.List>
            </Tabs>
            <Container className={style.searchContainer}>
                <Input
                    value={searchText}
                    leftSection={<FaSearch />}
                    size='md'
                    placeholder='「課程名」或「教師名」'
                    classNames={{ input: style.searchInput }}
                    className={style.search}
                    onChange={(e) => setSearchText(e.target.value)}
                />

                {showOrganizationFilters && (
                    <>
                        <Select
                            placeholder='選擇學院'
                            data={academyList?.academies ?? []}
                            value={academy || null}
                            size='md'
                            classNames={{ input: style.selectInput }}
                            className={style.select}
                            onChange={(value) => {
                                setAcademy(value ?? '')
                                setDepartment('')
                            }}
                            disabled={isLoadingAcademies}
                            searchable
                            clearable
                            nothingFoundMessage='找不到符合的學院'
                        />
                        <Select
                            placeholder='選擇系所'
                            data={departmentList?.departments ?? []}
                            value={department || null}
                            size='md'
                            classNames={{ input: style.selectInput }}
                            className={style.select}
                            onChange={(value) => setDepartment(value ?? '')}
                            disabled={isLoadingDepartments}
                            searchable
                            clearable
                            nothingFoundMessage='找不到符合的系所'
                        />
                    </>
                )}

                {showCourseTypeFilter && (
                    <Group grow gap='sm' className={style.filterRow}>
                        {activeTab === 'university' && (
                            <MultiSelect
                                placeholder='篩選年級（可多選）'
                                data={GRADE_OPTIONS}
                                value={grades}
                                size='md'
                                classNames={{ input: style.selectInput }}
                                onChange={setGrades}
                                searchable
                                clearable
                            />
                        )}
                        {activeTab === 'graduate' && (
                            <MultiSelect
                                placeholder='篩選年級（可多選）'
                                data={GRADUATE_LEVEL_OPTIONS}
                                value={graduateLevels}
                                size='md'
                                classNames={{ input: style.selectInput }}
                                onChange={setGraduateLevels}
                                searchable
                                clearable
                            />
                        )}
                        {activeTab === 'teacher' && (
                            <MultiSelect
                                placeholder='篩選開課班別（可多選）'
                                data={classNameList?.classNames ?? []}
                                value={classNames}
                                size='md'
                                classNames={{ input: style.selectInput }}
                                onChange={setClassNames}
                                disabled={isLoadingClassNames}
                                searchable
                                clearable
                            />
                        )}
                        <Select
                            placeholder='選擇修別'
                            data={['必修', '選修', '必選修']}
                            value={courseType || null}
                            size='md'
                            classNames={{ input: style.selectInput }}
                            onChange={(value) => setCourseType(value!)}
                            searchable
                        />
                    </Group>
                )}
                {activeTab !== 'ewant' && (
                    <Accordion
                        variant='separated'
                        radius='md'
                        className={style.advancedFilterAccordion}
                        value={advancedAccordionValue}
                        onChange={setAdvancedAccordionValue}
                    >
                        <Accordion.Item value='time-semester-filters'>
                            <Accordion.Control>
                                進階篩選：星期／節次／學期
                                <div className={style.advancedFilterSummary}>{advancedSummaryText}</div>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <MultiSelect
                                    placeholder='篩選星期（可多選）'
                                    data={weekdayOptions}
                                    value={weekdays}
                                    size='md'
                                    classNames={{ input: style.selectInput }}
                                    className={style.select}
                                    onChange={setWeekdays}
                                    searchable
                                    clearable
                                />
                                <MultiSelect
                                    placeholder='篩選節次（可多選）'
                                    data={periodOptions}
                                    value={periods}
                                    size='md'
                                    classNames={{ input: style.selectInput }}
                                    className={style.select}
                                    onChange={setPeriods}
                                    searchable
                                    clearable
                                />
                                <MultiSelect
                                    placeholder='篩選學期（可多選）'
                                    data={semesterOptions}
                                    value={semesters}
                                    size='md'
                                    classNames={{ input: style.selectInput }}
                                    className={style.select}
                                    onChange={setSemesters}
                                    searchable
                                    clearable
                                />
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>
                )}

                <Button
                    className={style.searchButton}
                    disabled={
                        (showOrganizationFilters && (isLoadingAcademies || isLoadingDepartments))
                        || (activeTab === 'teacher' && isLoadingClassNames)
                    }
                    onClick={() => handleClick()}
                >
                    搜尋
                </Button>
            </Container>
        </Container>
    )
}

export default CourseFilter
