import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Stack, Table, Text } from '@mantine/core'
import periodTimeMap from '../../utils/periodTimeMap'
import styles from '../../styles/components/Timetable.module.css'
import { TimetableGrid, WeekdayOption } from './types'

type TimetableGridTableProps = {
  periodOrder: string[]
  weekdaysToRender: WeekdayOption[]
  grid: TimetableGrid
}

type TimeRange = {
  startMin: number
  endMin: number
}

const parseTimeTokenToMinute = (value: string): number | null => {
  const match = value.match(/(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  return hour * 60 + minute
}

const getPeriodTimeLines = (period: string): { start: string; end: string } => {
  const raw = periodTimeMap[period as keyof typeof periodTimeMap] ?? ''
  const [start = '', end = ''] = raw.split('～').map((token) => token.trim())
  return { start, end }
}

const periodTimeRangeMap: Record<string, TimeRange> = Object.entries(periodTimeMap).reduce<Record<string, TimeRange>>((acc, [period, value]) => {
  const [startToken, endToken] = value.split('～').map((token) => token.trim())
  const startMin = parseTimeTokenToMinute(startToken)
  const endMin = parseTimeTokenToMinute(endToken)
  if (startMin === null || endMin === null) return acc
  acc[period] = { startMin, endMin }
  return acc
}, {})

const getCurrentDayAndPeriod = (now: Date): { day: number; period: string | null } => {
  const jsDay = now.getDay()
  const day = jsDay === 0 ? 7 : jsDay
  const minuteOfDay = now.getHours() * 60 + now.getMinutes()
  const period = Object.entries(periodTimeRangeMap).find(([, range]) => minuteOfDay >= range.startMin && minuteOfDay < range.endMin)?.[0] ?? null
  return { day, period }
}

const TimetableGridTable: React.FC<TimetableGridTableProps> = ({ periodOrder, weekdaysToRender, grid }) => {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const currentSlot = useMemo(() => getCurrentDayAndPeriod(now), [now])

  const nowCourses = useMemo(() => {
    if (!currentSlot.period) return []
    return grid[currentSlot.period]?.[currentSlot.day] ?? []
  }, [currentSlot, grid])

  const nowTimeLabel = currentSlot.period
    ? `第 ${currentSlot.period} 節　${getPeriodTimeLines(currentSlot.period).start} ～ ${getPeriodTimeLines(currentSlot.period).end}`
    : null

  return (
    <div className={styles.tableCard}>
      <div className={styles.nowBanner}>
        <span className={styles.nowDot} />
        <span className={styles.nowLabel}>現在</span>
        {nowTimeLabel ? (
          <>
            <span className={styles.nowTime}>{nowTimeLabel}</span>
            {nowCourses.length > 0 ? (
              <span className={styles.nowCourses}>
                {nowCourses.map((c, i) => (
                  <span key={c.courseId}>
                    {i > 0 && <span className={styles.nowSep}>/</span>}
                    <Link to={`/course/${c.courseId}`} className={styles.nowCourseLink}>
                      {c.courseName}
                    </Link>
                  </span>
                ))}
              </span>
            ) : (
              <span className={styles.nowEmpty}>本時段無排課</span>
            )}
          </>
        ) : (
          <span className={styles.nowEmpty}>非上課時段</span>
        )}
      </div>
      <div className={styles.tableScroll}>
        <Table striped highlightOnHover className={styles.timetableTable}>
          <colgroup>
            <col className={styles.timeColSpec} />
            {weekdaysToRender.map((day) => (
              <col key={`col-${day.value}`} className={styles.dayColSpec} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th aria-label='time-column' />
              {weekdaysToRender.map((day) => (
                <th key={day.value}>星期{day.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periodOrder.map((period) => (
              <tr key={period}>
                <td className={styles.timeColumn}>
                  <Text size='sm' fw={700} className={styles.periodNumber}>
                    {period}
                  </Text>
                  <Stack gap={0}>
                    <Text size='xs' c='dimmed' className={styles.periodTimeLine}>
                      {getPeriodTimeLines(period).start}
                    </Text>
                    <Text size='xs' c='dimmed' className={styles.periodTimeLine}>
                      {getPeriodTimeLines(period).end}
                    </Text>
                  </Stack>
                </td>
                {weekdaysToRender.map((day) => {
                  const slotCourses = grid[period]?.[day.value] ?? []
                  const hasConflict = slotCourses.length > 1
                  const isCurrentSlot = currentSlot.day === day.value && currentSlot.period === period
                  const cellClassName = [
                    hasConflict ? styles.conflictCell : styles.normalCell,
                    isCurrentSlot ? styles.currentTimeCell : '',
                  ].filter(Boolean).join(' ')
                  return (
                    <td key={`${period}-${day.value}`} className={cellClassName}>
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
                              <Text size='sm' fw={500} className={styles.courseNameText}>
                                {course.courseName}
                              </Text>
                              <Text size='xs' c='dimmed' className={styles.courseMetaText}>
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
    </div>
  )
}

export default TimetableGridTable
