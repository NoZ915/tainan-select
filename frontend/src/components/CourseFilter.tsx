import { useEffect, useState } from "react";
import { Container, Tabs, Input, Button, Select } from "@mantine/core";
import { FilterOption } from "../types/courseType";
import { FaSearch } from "react-icons/fa";
import style from "../styles/components/CourseFilter.module.css";
import { useGetDepartments } from "../hooks/courses/useGetDepartments";
import { useGetAcademies } from "../hooks/courses/useGetAcademies";

type CourseFilterProps = {
    searchParams: {
        page: number;
        limit: number;
        search: string;
        category: string;
        academy: string;
        department: string;
        courseType: string;
    };
    onSearch: (searchParams: {
        page: number;
        limit: number;
        search: string;
        category: string;
        academy: string;
        department: string;
        courseType: string;
    }) => void;
    onClick: (page: number) => void;
};

const CourseFilter: React.FC<CourseFilterProps> = ({ searchParams, onSearch, onClick }) => {
    const [searchText, setSearchText] = useState(searchParams.search);
    const [activeTab, setActiveTab] = useState(searchParams.category);
    const [academy, setAcademy] = useState(searchParams.academy);
    const [department, setDepartment] = useState(searchParams.department);
    const [courseType, setCourseType] = useState(searchParams.courseType);

    useEffect(() => {
        setSearchText(searchParams.search);
        setActiveTab(searchParams.category);
        setAcademy(searchParams.academy);
        setDepartment(searchParams.department);
        setCourseType(searchParams.courseType);
    }, [searchParams]);

    const filterOptions: FilterOption[] = [
        { label: "全部", value: "all" },
        { label: "通識", value: "general" },
        { label: "大學", value: "university" },
        { label: "研究所", value: "graduate" },
        { label: "師培", value: "teacher" },
    ];
    const { data: departmentList, isLoading: isLoadingDepartments } = useGetDepartments();
    const { data: academyList, isLoading: isLoadingAcademies } = useGetAcademies();

    const handleTabChange = (value: string) => {
        setSearchText("");
        setActiveTab(value ?? "all");
        setAcademy("");
        setDepartment("");
        setCourseType("");
        onSearch({
            page: 1,
            limit: 9,
            search: "",
            category: value,
            academy: "",
            department: "",
            courseType: "",
        });
    }
    const handleClick = () => {
        onClick(1);
        onSearch({
            page: 1,
            limit: 9,
            search: searchText,
            category: activeTab,
            academy,
            department,
            courseType,
        });
    };

    return (
        <Container key={activeTab} className={style.container}>
            <Tabs value={activeTab} className={style.tabs} classNames={{ tab: style.tab }} onChange={(value: string | null) => handleTabChange(value ?? "all")}>
                <Tabs.List justify="center" className={style.tabsList}>
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
                    size="md"
                    placeholder="「課程名」或「教師名」"
                    classNames={{ input: style.searchInput }}
                    className={style.search}
                    onChange={(e) => setSearchText(e.target.value)}
                />

                {(activeTab === "university" || activeTab === "graduate") && !isLoadingDepartments && !isLoadingAcademies && (
                    <>
                        <Select
                            placeholder="選擇學院"
                            data={academyList?.academies ?? []}
                            value={academy || null}
                            size="md"
                            classNames={{ input: style.selectInput }}
                            className={style.select}
                            onChange={(value) => setAcademy(value!)}
                            searchable
                        />
                        <Select
                            placeholder="選擇系所"
                            data={departmentList?.departments ?? []}
                            value={department || null}
                            size="md"
                            classNames={{ input: style.selectInput }}
                            className={style.select}
                            onChange={(value) => setDepartment(value!)}
                            searchable
                        />
                    </>
                )}

                {activeTab === "university" && (
                    <Select
                        placeholder="選擇修別"
                        data={["必修", "選修", "必選修"]}
                        value={courseType || null}
                        size="md"
                        classNames={{ input: style.selectInput }}
                        className={style.select}
                        onChange={(value) => setCourseType(value!)}
                        searchable
                    />
                )}

                <Button className={style.searchButton} onClick={() => handleClick()}>
                    搜尋
                </Button>
            </Container>
        </Container>
    )
}

export default CourseFilter;