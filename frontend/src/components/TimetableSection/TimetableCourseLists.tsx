import { Link } from 'react-router-dom'
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core'
import { FaTrashAlt } from 'react-icons/fa'
import styles from '../../styles/components/Timetable.module.css'
import { TimetableListItem } from './types'

type TimetableCourseListsProps = {
  addedItemsInSelectedSemester: TimetableListItem[]
  ewantItemsInSelectedSemester: TimetableListItem[]
  isRemoving: boolean
  onRemoveCourse: (item: TimetableListItem) => void
}

const TimetableCourseLists: React.FC<TimetableCourseListsProps> = ({
  addedItemsInSelectedSemester,
  ewantItemsInSelectedSemester,
  isRemoving,
  onRemoveCourse,
}) => {
  return (
    <div className={styles.listGrid}>
      <div className={`${styles.listPanel} ${styles.addedPanel}`}>
        <Group justify='space-between' mb='xs'>
          <Text fw={600}>一般課程明細</Text>
          <Badge variant='light' color='red'>{addedItemsInSelectedSemester.length}</Badge>
        </Group>
        {addedItemsInSelectedSemester.length === 0 ? (
          <Stack gap={2}>
            <Text size='sm' fw={600}>此學期課表目前沒有一般課程。</Text>
            <Text size='sm' c='dimmed'>可使用上方「搜尋加入課程」，或從課程詳情頁直接加入。</Text>
          </Stack>
        ) : (
          <Stack gap={0}>
            {addedItemsInSelectedSemester.map((item) => (
              <div key={`${item.timetableId ?? 'guest'}-${item.course.id}`} className={styles.listRow}>
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
                    aria-label={`從課表移除「${item.course.name}」`}
                  >
                    <FaTrashAlt size={14} />
                  </ActionIcon>
                </Tooltip>
              </div>
            ))}
          </Stack>
        )}
      </div>

      <div className={`${styles.listPanel} ${styles.asyncPanel}`}>
        <Group justify='space-between' mb='xs'>
          <Text fw={600}>遠距課程</Text>
          <Badge variant='light' color='blue'>{ewantItemsInSelectedSemester.length}</Badge>
        </Group>
        {ewantItemsInSelectedSemester.length === 0 ? (
          <Stack gap={2}>
            <Text size='sm' fw={600}>此學期目前沒有遠距課程。</Text>
            <Text size='sm' c='dimmed'>EWANT 課程加入後會集中列在這裡，不顯示在時間格中。</Text>
          </Stack>
        ) : (
          <Stack gap={0}>
            {ewantItemsInSelectedSemester.map((item) => (
              <div key={`${item.timetableId ?? 'guest'}-${item.course.id}`} className={styles.listRow}>
                <Link to={`/course/${item.course.id}`} className={styles.courseInfoLink}>
                  <div className={styles.courseInfoBlock}>
                    <Group gap='xs'>
                      <Text size='sm' fw={600} ta='left'>
                        {item.course.name}
                      </Text>
                      <Badge size='xs' color='blue' variant='light'>
                        遠距
                      </Badge>
                    </Group>
                    <Text size='xs' c='dimmed' ta='left'>
                      {[item.course.instructor, item.semester, item.course.room].filter(Boolean).join('・')}
                    </Text>
                    <Text size='xs' c='dimmed' ta='left'>
                      {item.course.courseTime || '非同步／無固定時段'}
                    </Text>
                  </div>
                </Link>
                <Tooltip label='從課表移除'>
                  <ActionIcon
                    color='red'
                    variant='light'
                    loading={isRemoving}
                    onClick={() => onRemoveCourse(item)}
                    aria-label={`從課表移除「${item.course.name}」`}
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
