import { Link } from 'react-router-dom'

import formatCourseTime from '../utils/formatCourseTime.tsx'
import { useIsMobile } from '../hooks/useIsMobile'
import { CourseDetailResponse } from '../types/courseType'

import { Badge, Flex, Group, Text } from '@mantine/core'
import style from '../styles/components/CourseInfoPanel.module.css'

import InterestButton from './InterestButton'

interface CourseInfoPanelProps {
  course: CourseDetailResponse | null | undefined;
  isLoading: boolean;
}

const CourseInfoPanel: React.FC<CourseInfoPanelProps> = ({ course, isLoading }) => {
  const isMobile = useIsMobile()

  if (isLoading) {
    return <>載入中...</>
  }

  const courseData = course?.course
  const displayText = (value: unknown) => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'string') {
      const trimmedValue = value.trim()
      return trimmedValue.length > 0 ? trimmedValue : '-'
    }
    return String(value)
  }

  const courseName = displayText(courseData?.course_name)
  const courseUrl = courseData?.course_url
  const semester = displayText(courseData?.semester)
  const academy = displayText(courseData?.academy)
  const instructor = displayText(courseData?.instructor)
  const instructorUrl = courseData?.instructor_url
  const courseTime = courseData?.course_time ? formatCourseTime(courseData.course_time) : '-'
  const courseRoom = displayText(courseData?.course_room)
  const mobileCourseMeta = [
    courseData?.course_time ? formatCourseTime(courseData.course_time) : null,
    courseData?.course_room?.trim() || null,
  ].filter(Boolean)
  const courseType = displayText(courseData?.course_type)
  const creditHours = displayText(courseData?.credit_hours)

  if (isMobile) {
    return (
      <Flex direction='column' align='flex-start' className={style.flex}>
        <Group>
          <Text size='md' fw={900} className={style.courseName}>
            {courseName}
            {courseUrl && <Link to={courseUrl} target='_blank' className={style.link}>🔗</Link>}
          </Text>
          <Badge radius='sm'>{semester}</Badge>
          {course && <InterestButton course={course} />}
        </Group>

        <div>
          <Text className={style.label}>開課單位 / 授課老師</Text>
          <Text className={style.courseDetail}>{academy} / {instructor}
            {instructorUrl && <Link to={instructorUrl} target='_blank' className={style.link}>🔗</Link>}</Text>
        </div>

        <div>
          <Text className={style.label}>上課時間 / 上課教室</Text>
          <Text className={style.courseDetail}>
            {mobileCourseMeta.length > 0
              ? mobileCourseMeta.map((item, index) => (
                <span key={index}>
                  {index > 0 ? ' / ' : ''}
                  {item}
                </span>
              ))
              : '-'}
          </Text>
        </div>

        <div>
          <Text className={style.label}>修別 / 學分數</Text>
          <Text className={style.courseDetail}>{courseType} / {creditHours}</Text>
        </div>
      </Flex>
    )
  }

  return (
    <Flex direction='column' align='flex-start' className={style.flex}>
      <Group>
        <Text size='md' fw={900} className={style.courseName}>
          {courseName}
          {courseUrl && <Link to={courseUrl} target='_blank' className={style.link}>🔗</Link>}
        </Text>
        <Badge radius='sm'>{semester}</Badge>
        {course && <InterestButton course={course} />}
      </Group>

      <div>
        <Text className={style.label}>開課單位</Text>
        <Text className={style.courseDetail}>{academy}</Text>
      </div>

      <div>
        <Text className={style.label} style={{ textAlign: 'left' }}>授課老師</Text>
        <Text className={style.courseDetail}>
          {instructor}
          {instructorUrl && <Link to={instructorUrl} target='_blank' className={style.link}>🔗</Link>}
        </Text>
      </div>

      <div>
        <Text className={style.label}>上課時間</Text>
        <Text className={style.courseDetail}>{courseTime}</Text>
      </div>

      <div>
        <Text className={style.label}>上課教室</Text>
        <Text className={style.courseDetail}>{courseRoom}</Text>
      </div>

      <div>
        <Text className={style.label}>修別</Text>
        <Text className={style.courseDetail}>{courseType}</Text>
      </div>

      <div>
        <Text className={style.label}>學分數</Text>
        <Text className={style.courseDetail}>{creditHours}</Text>
      </div>
    </Flex>
  )
}

export default CourseInfoPanel
