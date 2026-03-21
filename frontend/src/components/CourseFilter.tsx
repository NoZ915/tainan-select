import { useEffect, useState } from 'react'
import { Container, Tabs, Input, Button, Select, MultiSelect, Accordion } from '@mantine/core'
import { SearchParams, FilterOption } from '../types/courseType'
import { FaSearch } from 'react-icons/fa'
import style from '../styles/components/CourseFilter.module.css'
import { useGetDepartments } from '../hooks/courses/useGetDepartments'
import { useGetAcademies } from '../hooks/courses/useGetAcademies'
import { useGetSemesters } from '../hooks/semesters/useGetSemesters'
import periodTimeMap from '../utils/periodTimeMap'

interface CourseFilterProps {
    searchParams: SearchParams;
    onSearch: (searchParams: SearchParams) => void;
    onClick: (page: number) => void;
};

const CourseFilter: React.FC<CourseFilterProps> = ({ searchParams, onSearch, onClick }) => {
    const [searchText, setSearchText] = useState(searchParams.search)
    const [activeTab, setActiveTab] = useState(searchParams.category)
    const [academy, setAcademy] = useState(searchParams.academy)
    const [department, setDepartment] = useState(searchParams.department)
    const [courseType, setCourseType] = useState(searchParams.courseType)
    const [weekdays, setWeekdays] = useState<string[]>(searchParams.weekdays)
    const [periods, setPeriods] = useState<string[]>(searchParams.periods)
    const [semesters, setSemesters] = useState<string[]>(searchParams.semesters)
    const [advancedAccordionValue, setAdvancedAccordionValue] = useState<string | null>(null)

    useEffect(() => {
        setSearchText(searchParams.search)
        setActiveTab(searchParams.category)
        setAcademy(searchParams.academy)
        setDepartment(searchParams.department)
        setCourseType(searchParams.courseType)
        setWeekdays(searchParams.weekdays)
        setPeriods(searchParams.periods)
        setSemesters(searchParams.semesters)
    }, [searchParams])

    const filterOptions: FilterOption[] = [
        { label: '全部', value: 'all' },
        { label: '通識', value: 'general' },
        { label: '大學', value: 'university' },
        { label: '研究所', value: 'graduate' },
        { label: '師培', value: 'teacher' },
        { label: 'EWANT', value: 'ewant' },
    ]
    const { data: departmentList, isLoading: isLoadingDepartments } = useGetDepartments()
    const { data: academyList, isLoading: isLoadingAcademies } = useGetAcademies()
    const { data: semesterList } = useGetSemesters()
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

                {(activeTab === 'university' || activeTab === 'graduate') && !isLoadingDepartments && !isLoadingAcademies && (
                    <>
                        <Select
                            placeholder='選擇學院'
                            data={academyList?.academies ?? []}
                            value={academy || null}
                            size='md'
                            classNames={{ input: style.selectInput }}
                            className={style.select}
                            onChange={(value) => setAcademy(value!)}
                            searchable
                        />
                        <Select
                            placeholder='選擇系所'
                            data={departmentList?.departments ?? []}
                            value={department || null}
                            size='md'
                            classNames={{ input: style.selectInput }}
                            className={style.select}
                            onChange={(value) => setDepartment(value!)}
                            searchable
                        />
                    </>
                )}

                {activeTab === 'university' && (
                    <Select
                        placeholder='選擇修別'
                        data={['必修', '選修', '必選修']}
                        value={courseType || null}
                        size='md'
                        classNames={{ input: style.selectInput }}
                        className={style.select}
                        onChange={(value) => setCourseType(value!)}
                        searchable
                    />
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

                <Button className={style.searchButton} onClick={() => handleClick()}>
                    搜尋
                </Button>
            </Container>
        </Container>
    )
}

export default CourseFilter
