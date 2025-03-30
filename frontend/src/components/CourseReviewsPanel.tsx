import { Card, Flex } from "@mantine/core";
import style from "../styles/components/CourseReviewsPanel.module.css";

const CourseReviewsPanel: React.FC = () => {
    return (
        <Flex direction="column" align="flex-start" className={style.flex}>
            <Card></Card>
        </Flex>
    )
}

export default CourseReviewsPanel;