import { Link } from 'react-router-dom'

import formatCourseTime from '../utils/formatCourseTime'
import { Course } from '../types/courseType'

import { FaCommentAlt, FaHeart, FaEye, FaNewspaper } from 'react-icons/fa'
import { Badge, Card, Group, Text } from '@mantine/core'
import style from '../styles/components/CourseCard.module.css'

interface CourseCardProp {
	course: Course
}

const CourseCard: React.FC<CourseCardProp> = ({ course }) => {
	const courseLocationAndTimeParts = [
		course.course_room?.trim(),
		course.course_time ? formatCourseTime(course.course_time) : null,
	].filter(Boolean)
	const courseLocationAndTime = courseLocationAndTimeParts.length > 0
		? courseLocationAndTimeParts.map((part, index) => (
			<span key={index}>{index > 0 ? ' / ' : ''}{part}</span>
		))
		: null

	return (
		<Card padding='lg' className={style.courseCard}>
			<Link to={`/course/${course.id}`} className={style.courseLink}>
				<div className={style.courseMain}>
					<Group gap='xs' align='flex-start' wrap='nowrap' className={style.courseTitleRow}>
						<Text className={style.courseTitle}>{course.course_name}</Text>
						<Badge className={style.semesterBadge} color='brick-red.6' variant='light' radius='sm'>
							{course.semester}
						</Badge>
					</Group>

					<div className={style.courseMeta}>
						{course.instructor && (
							<Text size='sm' fw={400} c='gray'>{course.instructor}</Text>
						)}
						{courseLocationAndTime && (
							<Text size='sm' c='dimmed' w='100%'>{courseLocationAndTime}</Text>
						)}
					</div>

					<div className={style.courseBadges}>
						{course.academy && (
							<Badge color='brick-red.3' radius='sm'>{course.academy}</Badge>
						)}
						{course.department && (
							<Badge color='brick-red.3' variant='light' radius='sm'>{course.department}</Badge>
						)}
					</div>
				</div>

				<hr className={style.statsDivider} />

				<div className={style.courseCardStats}>
					<span className={style.statItem}>
						<FaCommentAlt size={13} />
						<Text size='sm'>{course.review_count}</Text>
					</span>
					<span className={style.statItem}>
						<FaNewspaper size={13} />
						<Text size='sm'>{course.dcard_related_post_count ?? 0}</Text>
					</span>
					<span className={style.statItem}>
						<FaHeart size={13} />
						<Text size='sm'>{course.interests_count}</Text>
					</span>
					<span className={style.statItem}>
						<FaEye size={13} />
						<Text size='sm'>{course.view_count}</Text>
					</span>
				</div>
			</Link>
		</Card>
	)
}

export default CourseCard
