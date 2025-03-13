import { useState } from "react";
import { Container, Tabs, Input, Button, Select } from "@mantine/core";
import { FilterOption } from "../types/courseType";
import { FaSearch } from "react-icons/fa";
import style from "../styles/components/CourseFilter.module.css";

type CourseFilterProps = {
    onSearch: (searchParams: {
        search: string;
        category: string;
        faculty: string;
        department: string;
        grade: string;
        courseType: string;
    }) => void;
    onClick: (page: number) => void;
};

const CourseFilter: React.FC<CourseFilterProps> = ({ onSearch, onClick }) => {
    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const [faculty, setFaculty] = useState("");
    const [department, setDepartment] = useState("");
    const [grade, setGrade] = useState("");
    const [courseType, setCourseType] = useState("");


    const filterOptions: FilterOption[] = [
        { label: "全部", value: "all" },
        { label: "通識", value: "general" },
        { label: "大學", value: "university" },
        { label: "研究所", value: "graduate" },
        { label: "師培", value: "teacher" },
    ];

    const handleTabChange = (value: string | null) => {
        setActiveTab(value ?? "all");
        setFaculty("");
        setDepartment("");
        setGrade("");
        setCourseType("");
    }
    const handleClick = () => {
        onClick(1);
        onSearch({
            search: searchText,
            category: activeTab,
            faculty,
            department,
            grade,
            courseType,
        });
    }

    return (
        <Container className={style.container}>
            <Tabs value={activeTab} className={style.tabs} classNames={{ tab: style.tab }} onChange={(value) => handleTabChange(value)}>
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
            <Input
                leftSection={<FaSearch />}
                size="md"
                placeholder="搜尋「課程名」或「教師名」"
                classNames={{ input: style.searchInput }}
                className={style.search}
                onChange={(e) => setSearchText(e.target.value)}
            />

            {(activeTab === "university" || activeTab === "graduate") && (
                <>
                    <Select
                        placeholder="選擇學院"
                        data={["文學院", "理學院", "工學院"]}
                        value={faculty}
                        onChange={(value) => setFaculty(value!)}
                    />
                    <Select
                        placeholder="選擇系所"
                        data={["中文系", "電機系", "資工系"]}
                        value={department}
                        onChange={(value) => setDepartment(value!)}
                    />
                </>
            )}

            {activeTab === "university" && (
                <>
                    <Select
                        placeholder="選擇年級"
                        data={["一年級", "二年級", "三年級", "四年級"]}
                        value={grade}
                        onChange={(value) => setGrade(value!)}
                    />
                    <Select
                        placeholder="選擇修別"
                        data={["必修", "選修", "必選修"]}
                        value={courseType}
                        onChange={(value) => setCourseType(value!)}
                    />
                </>
            )}

            <Button className={style.searchButton} onClick={() => handleClick()}>
                搜尋
            </Button>
        </Container>
    )
}

export default CourseFilter;