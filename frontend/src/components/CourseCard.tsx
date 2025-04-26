import { Badge, Card, Group, Text } from "@mantine/core";
import style from "../styles/components/CourseCard.module.css";
import { FaCommentAlt, FaHeart, FaEye } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Course } from "../types/courseType";

interface CourseCardProp {
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

				<Group justify="center" mt="md" className={style.courseCardStats}>
					<Group gap="xs">
						<FaCommentAlt size={16} />
						<Text size="sm">{course.review_count}</Text>
					</Group>
					<Group gap="xs">
						<FaHeart size={16} />
						<Text size="sm">{course.interests_count}</Text>
					</Group>
					<Group gap="xs">
						<FaEye size={16} />
						<Text size="sm">{course.view_count}</Text>
					</Group>
				</Group>
			</Link>
		</Card>
	)
}

export default CourseCard;