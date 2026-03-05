import { Link } from 'react-router-dom'
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core'
import { FaPlus, FaTrashAlt } from 'react-icons/fa'
import styles from '../../styles/components/Timetable.module.css'
import { AddedTimetableItem, SelectableInterestCourse } from './types'

type TimetableCourseListsProps = {
  selectableInterestCourses: SelectableInterestCourse[]
  addedItemsInSelectedSemester: AddedTimetableItem[]
  isAdding: boolean
  isRemoving: boolean
  onAddCourse: (course: SelectableInterestCourse) => void
  onRemoveCourse: (item: AddedTimetableItem) => void
}

const TimetableCourseLists: React.FC<TimetableCourseListsProps> = ({
  selectableInterestCourses,
  addedItemsInSelectedSemester,
  isAdding,
  isRemoving,
  onAddCourse,
  onRemoveCourse,
}) => {
  return (
    <div className={styles.listGrid}>
      <div className={`${styles.listPanel} ${styles.favoritePanel}`}>
        <Group justify='space-between' mb='xs'>
          <Text fw={600}>本學期收藏（可加入）</Text>
          <Badge variant='light' color='green'>{selectableInterestCourses.length}</Badge>
        </Group>
        {selectableInterestCourses.length === 0 ? (
          <Stack gap={2}>
            <Text size='sm' fw={600}>目前沒有可加入課表的課程。</Text>
            <Text size='sm' c='dimmed'>若想加入課表，請先到課程頁按「收藏」，收藏後才可加入課表。</Text>
          </Stack>
        ) : (
          <Stack gap={0}>
            {selectableInterestCourses.map((course) => (
              <div key={course.id} className={styles.listRow}>
                <Link to={`/course/${course.id}`} className={styles.courseInfoLink}>
                  <div className={styles.courseInfoBlock}>
                    <Text size='sm' fw={600} ta='left'>
                      {course.course_name}
                    </Text>
                    <Text size='xs' c='dimmed' ta='left'>
                      {[course.instructor, course.semester, course.course_room].filter(Boolean).join('・')}
                    </Text>
                    <Text size='xs' c='dimmed' ta='left'>{course.course_time}</Text>
                  </div>
                </Link>
                <Tooltip label='加入課表'>
                  <ActionIcon
                    color='green'
                    variant='light'
                    loading={isAdding}
                    onClick={() => onAddCourse(course)}
                  >
                    <FaPlus size={14} />
                  </ActionIcon>
                </Tooltip>
              </div>
            ))}
          </Stack>
        )}
      </div>

      <div className={`${styles.listPanel} ${styles.addedPanel}`}>
        <Group justify='space-between' mb='xs'>
          <Text fw={600}>已加入課程</Text>
          <Badge variant='light' color='red'>{addedItemsInSelectedSemester.length}</Badge>
        </Group>
        {addedItemsInSelectedSemester.length === 0 ? (
          <Stack gap={2}>
            <Text size='sm' fw={600}>此學期課表目前沒有課程。</Text>
            <Text size='sm' c='dimmed'>可從「本學期收藏（可加入）」清單，將收藏課程加入課表。</Text>
          </Stack>
        ) : (
          <Stack gap={0}>
            {addedItemsInSelectedSemester.map((item) => (
              <div key={`${item.timetableId}-${item.course.id}`} className={styles.listRow}>
                <Link to={`/course/${item.course.id}`} className={styles.courseInfoLink}>
                  <div className={styles.courseInfoBlock}>
                    <Group gap='xs'>
                      <Text size='sm' fw={600} ta='left'>
                        {item.course.name}
                      </Text>
                      {!item.hasTimeslots && (
                        <Badge size='xs' color='orange' variant='light'>
                          缺時段
                        </Badge>
                      )}
                    </Group>
                    <Text size='xs' c='dimmed' ta='left'>
                      {[item.course.instructor, item.semester, item.course.room].filter(Boolean).join('・')}
                    </Text>
                    <Text size='xs' c='dimmed' ta='left'>{item.course.courseTime}</Text>
                  </div>
                </Link>
                <Tooltip label='從課表移除'>
                  <ActionIcon
                    color='red'
                    variant='light'
                    loading={isRemoving}
                    onClick={() => onRemoveCourse(item)}
                  >
                    <FaTrashAlt size={14} />
                  </ActionIcon>
                </Tooltip>
              </div>
            ))}
          </Stack>
        )}
      </div>
    </div>
  )
}

export default TimetableCourseLists
