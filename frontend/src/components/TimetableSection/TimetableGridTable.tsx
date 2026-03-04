import { Link } from 'react-router-dom'
import { Paper, Stack, Table, Text } from '@mantine/core'
import periodTimeMap from '../../utils/periodTimeMap'
import styles from '../../styles/components/Timetable.module.css'
import { TimetableGrid, WeekdayOption } from './types'

type TimetableGridTableProps = {
  periodOrder: string[]
  weekdaysToRender: WeekdayOption[]
  grid: TimetableGrid
}

const TimetableGridTable: React.FC<TimetableGridTableProps> = ({ periodOrder, weekdaysToRender, grid }) => {
  return (
    <Paper withBorder p='md' radius='md'>
      <div className={styles.tableScroll}>
        <Table striped highlightOnHover className={styles.timetableTable}>
          <thead>
            <tr>
              <th>時間＼星期</th>
              {weekdaysToRender.map((day) => (
                <th key={day.value}>星期{day.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodOrder.map((period) => (
              <tr key={period}>
                <td className={styles.timeColumn}>
                  <Text size='sm' fw={600}>
                    第{period}節
                  </Text>
                  <Text size='xs' c='dimmed'>
                    {periodTimeMap[period as keyof typeof periodTimeMap]}
                  </Text>
                </td>
                {weekdaysToRender.map((day) => {
                  const slotCourses = grid[period]?.[day.value] ?? []
                  const hasConflict = slotCourses.length > 1
                  return (
                    <td key={`${period}-${day.value}`} className={hasConflict ? styles.conflictCell : styles.normalCell}>
                      {slotCourses.length === 0 ? (
                        <Text c='dimmed' size='xs'>-</Text>
                      ) : (
                        <Stack gap={4}>
                          {slotCourses.map((course) => (
                            <Link
                              key={`${course.courseId}-${course.courseName}`}
                              to={`/course/${course.courseId}`}
                              className={styles.tableCourseLink}
                            >
                              <Text size='sm' fw={500}>
                                {course.courseName}
                              </Text>
                              <Text size='xs' c='dimmed'>
                                {[course.instructor, course.room].filter(Boolean).join('・')}
                              </Text>
                            </Link>
                          ))}
                        </Stack>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Paper>
  )
}

export default TimetableGridTable
