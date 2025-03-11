import { useState } from "react";
import { Container, Tabs, Input, Button } from "@mantine/core";
import { FilterOption } from "../types/courseType";
import { FaSearch } from "react-icons/fa";
import style from "../styles/components/CourseFilter.module.css";

type CourseFilterProps = {
    onSearch: (search: string) => void;
};

const CourseFilter: React.FC<CourseFilterProps> = ({ onSearch }) => {
    const [searchText, setSearchText] = useState("");

    const filterOptions: FilterOption[] = [
        { label: "全部", value: "all" },
        { label: "通識", value: "general" },
        { label: "大學", value: "university" },
        { label: "研究所", value: "graduate" },
        { label: "師培", value: "teacher" },
    ];

    return (
        <Container className={style.container}>
            <Tabs defaultValue="all" className={style.tabs} classNames={{ tab: style.tab }}>
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
            <Button className={style.searchButton} onClick={() => onSearch(searchText)}>
                搜尋
            </Button>
        </Container>
    )
}

export default CourseFilter;