import { Badge, Card, Group, Text } from "@mantine/core";
import style from "../styles/components/CourseCard.module.css";
import { Link } from "react-router-dom";
import { Course } from "../types/courseType";

interface CourseCardProp{
	course: Course
}

const CourseCard: React.FC<CourseCardProp> = ({ course }) => {
	return (
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
	)
}

export default CourseCard;