import { Badge, Flex, Group, Text } from "@mantine/core";
import { Course } from "../types/courseType";
import style from "../styles/components/CourseInfoPanel.module.css"
import { Link } from "react-router-dom";
import { useIsMobile } from "../hooks/useIsMobile";
import InterestButton from "./InterestButton";

interface CourseInfoPanelProps {
  course: { course: Course, hasUserAddInterest: boolean } | null | undefined;
  isLoading: boolean;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ course, isLoading }) => {
  const isMobile = useIsMobile();

  if (isLoading) {
    return <>Is Loading...</>
  }

  if (!course) {
    return <>Course information is not available.</>;
  }

  if (isMobile) {
    return (
      <Flex direction="column" align="flex-start" className={style.flex}>
        <Group>
          <Text size="md" fw={900} className={style.courseName}>
            {course.course.course_name}
            {course.course.course_url && <Link to={course.course.course_url} target="_blank" className={style.link}>🔗</Link>}
          </Text>
          <Badge radius="sm">{course.course.semester}</Badge>
          <InterestButton course={course} />
        </Group>

        <div>
          <Text className={style.label}>開課單位 / 授課老師</Text>
          <Text className={style.courseDetail}>{course.course.academy} / {course.course.instructor}
            {course.course.instructor_url && <Link to={course.course.instructor_url} target="_blank" className={style.link}>🔗</Link>}</Text>
        </div>

        <div>
          <Text className={style.label}>上課時間 / 上課教室</Text>
          <Text className={style.courseDetail}>{course.course.course_time} / {course.course.course_room}</Text>
        </div>

        <div>
          <Text className={style.label}>修別 / 學分數</Text>
          <Text className={style.courseDetail}>{course.course.course_type} / {course.course.credit_hours}</Text>
        </div>
      </Flex>
    )
  }

  return (
    <Flex direction="column" align="flex-start" className={style.flex}>
      <Group>
        <Text size="md" fw={900} className={style.courseName}>
          {course.course.course_name}
          {course.course.course_url && <Link to={course.course.course_url} target="_blank" className={style.link}>🔗</Link>}
        </Text>
        <Badge radius="sm">{course.course.semester}</Badge>
        <InterestButton course={course} />
      </Group>

      <div>
        <Text className={style.label}>開課單位</Text>
        <Text className={style.courseDetail}>{course.course.academy}</Text>
      </div>

      <div>
        <Text className={style.label} style={{ textAlign: "left" }}>授課老師</Text>
        <Text className={style.courseDetail}>
          {course.course.instructor}
          {course.course.instructor_url && <Link to={course.course.instructor_url} target="_blank" className={style.link}>🔗</Link>}
        </Text>
      </div>

      <div>
        <Text className={style.label}>上課時間</Text>
        <Text className={style.courseDetail}>{course.course.course_time}</Text>
      </div>

      <div>
        <Text className={style.label}>上課教室</Text>
        <Text className={style.courseDetail}>{course.course.course_room}</Text>
      </div>

      <div>
        <Text className={style.label}>修別</Text>
        <Text className={style.courseDetail}>{course.course.course_type}</Text>
      </div>

      <div>
        <Text className={style.label}>學分數</Text>
        <Text className={style.courseDetail}>{course.course.credit_hours}</Text>
      </div>
    </Flex>
  )
}

export default CourseInfoPanel;