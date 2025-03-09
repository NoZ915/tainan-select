import { Container, Input, Tabs } from "@mantine/core";
import { FilterOption } from "../types/courseType";
import { FaSearch } from "react-icons/fa";

const CourseFilter: React.FC = () => {
    const filterOptions: FilterOption[] = [
        { label: "全部", value: "all" },
        { label: "通識", value: "general" },
        { label: "大學", value: "university" },
        { label: "研究所", value: "graduate" },
        { label: "師培", value: "teacher" },
    ];

    return (
        <Container>
            <Tabs defaultValue="all">
                <Tabs.List justify="center">
                    {filterOptions.map((option) => {
                        return (
                            <Tabs.Tab key={option.value} value={option.value}>
                                {option.label}
                            </Tabs.Tab>
                        )
                    })}
                </Tabs.List>
            </Tabs>
            <Input
                leftSection={<FaSearch />}
                placeholder="搜尋「課程名」或「教師名」"
                
            />
        </Container>
    )
}

export default CourseFilter;