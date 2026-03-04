import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActionIcon, Alert, Badge, Group, Paper, Select, Stack, Table, Text, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { FaPlus } from 'react-icons/fa'
import { FaTrashAlt } from 'react-icons/fa'

import periodTimeMap from '../../utils/periodTimeMap'
import { useAuthStore } from '../../stores/authStore'
import { useGetSemesters } from '../../hooks/semesters/useGetSemesters'
import { useGetTimetable } from '../../hooks/timetables/useGetTimetable'
import { useRemoveTimetableCourse } from '../../hooks/timetables/useRemoveTimetableCourse'
import { useAddTimetableCourse } from '../../hooks/timetables/useAddTimetableCourse'
import { useGetTimetableInterestOptions } from '../../hooks/timetables/useGetTimetableInterestOptions'
import { useGetAllTimetableItems } from '../../hooks/timetables/useGetAllTimetableItems'
import { TimetableConflict, TimetableItem } from '../../types/timetableType'
import { addTimetableCourse, removeTimetableCourse } from '../../apis/timetableAPI'
import { ApiError } from '../../apis/axiosInstance'
import { QUERY_KEYS } from '../../hooks/queryKeys'

import styles from '../../styles/components/Timetable.module.css'
import SwapConflictModal from './SwapConflictModal'

type Weekday = '一' | '二' | '三' | '四' | '五' | '六' | '日'
type PeriodKey = keyof typeof periodTimeMap

type GridCell = {
  courseId: number
  courseName: string
  instructor: string
  room?: string
}

type TimetableGrid = Record<PeriodKey, Partial<Record<number, GridCell[]>>>

const weekdays: { label: Weekday; value: number }[] = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 },
]

const periodOrder = Object.keys(periodTimeMap) as PeriodKey[]
const periodIndexMap = periodOrder.reduce<Record<string, number>>((acc, period, index) => {
  acc[period] = index
  return acc
}, {})

const getPeriodsInRange = (startPeriod: PeriodKey, endPeriod: PeriodKey): PeriodKey[] => {
  const startIndex = periodIndexMap[startPeriod]
  const endIndex = periodIndexMap[endPeriod]
  if (typeof startIndex !== 'number' || typeof endIndex !== 'number' || endIndex < startIndex) return []
  return periodOrder.slice(startIndex, endIndex + 1)
}

const buildGrid = (items: TimetableItem[]): TimetableGrid => {
  const grid = {} as TimetableGrid
  periodOrder.forEach((period) => {
    grid[period] = {}
  })

  items.forEach((item) => {
    item.timeslots.forEach((timeslot) => {
      const periods = getPeriodsInRange(timeslot.startPeriod as PeriodKey, timeslot.endPeriod as PeriodKey)
      periods.forEach((period) => {
        const current = grid[period][timeslot.dayOfWeek] ?? []
        current.push({
          courseId: item.course.id,
          courseName: item.course.name,
          instructor: item.course.instructor,
          room: item.course.room,
        })
        grid[period][timeslot.dayOfWeek] = current
      })
    })
  })

  return grid
}

const Timetable: React.FC = () => {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuthStore()
  const { data: semestersData, isLoading: isSemestersLoading } = useGetSemesters()

  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const semesterOptions = useMemo(
    () => (semestersData?.items ?? []).map((semester) => ({ value: semester, label: semester })),
    [semestersData]
  )

  useEffect(() => {
    if (!selectedSemester && semesterOptions.length > 0) {
      setSelectedSemester(semesterOptions[0].value)
    }
  }, [selectedSemester, semesterOptions])

  const { data: timetableData, isLoading: isTimetableLoading } = useGetTimetable(selectedSemester, isAuthenticated)
  const { data: allAddedItemsData } = useGetAllTimetableItems(isAuthenticated)
  const { data: interestOptionsData = [] } = useGetTimetableInterestOptions(isAuthenticated)
  const addCourseMutation = useAddTimetableCourse()
  const removeCourseMutation = useRemoveTimetableCourse()
  const [isSwapDialogOpened, setIsSwapDialogOpened] = useState(false)
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false)
  const [swapTargetCourse, setSwapTargetCourse] = useState<{ id: number; name: string } | null>(null)
  const [swapConflicts, setSwapConflicts] = useState<TimetableConflict[]>([])
  const [swapContext, setSwapContext] = useState<{ timetableId: number; semester: string } | null>(null)

  const items = timetableData?.items ?? []
  const allAddedItems = allAddedItemsData?.items ?? []
  const addedItemsInSelectedSemester = useMemo(() => {
    if (!selectedSemester) return []
    return allAddedItems.filter((item) => item.semester === selectedSemester)
  }, [allAddedItems, selectedSemester])
  const timetableId = timetableData?.timetable.id
  const grid = useMemo(() => buildGrid(items), [items])
  const missingTimeslotCountInCurrentSemester = useMemo(
    () => items.filter((item) => item.timeslots.length === 0).length,
    [items],
  )
  const existingCourseIdSet = useMemo(() => new Set(items.map((item) => item.course.id)), [items])
  const selectableInterestCourses = useMemo(() => {
    if (!selectedSemester) return []
    return interestOptionsData
      .map((item) => item.course)
      .filter((course) => course.semester === selectedSemester)
      .filter((course) => !existingCourseIdSet.has(course.id))
  }, [interestOptionsData, selectedSemester, existingCourseIdSet])

  const conflicts = useMemo(
    () =>
      periodOrder.flatMap((period) =>
        weekdays
          .map((day) => {
            const slotCourses = grid[period]?.[day.value] ?? []
            if (slotCourses.length <= 1) return null
            return {
              dayLabel: day.label,
              period,
              courses: slotCourses.map((course) => course.courseName),
            }
          })
          .filter((item): item is { dayLabel: Weekday; period: PeriodKey; courses: string[] } => item !== null),
      ),
    [grid],
  )
  const hasWeekendCourses = useMemo(
    () => items.some((item) => item.timeslots.some((timeslot) => timeslot.dayOfWeek === 6 || timeslot.dayOfWeek === 7)),
    [items],
  )
  const weekdaysToRender = useMemo(
    () => (hasWeekendCourses ? weekdays : weekdays.filter((day) => day.value <= 5)),
    [hasWeekendCourses],
  )

  const addedCourseNameMap = useMemo(() => {
    const map = new Map<number, string>()
    allAddedItems.forEach((item) => {
      map.set(item.course.id, item.course.name)
    })
    return map
  }, [allAddedItems])

  const handleAddCourse = async (course: { id: number; course_name: string }) => {
    if (!timetableId || !selectedSemester) return
    try {
      await addCourseMutation.mutateAsync({
        timetableId,
        courseId: course.id,
        semester: selectedSemester,
      })
    } catch (error) {
      const typedError = error as ApiError
      const errorData = typedError.data as { conflicts?: TimetableConflict[] } | undefined
      if (typedError.status === 409 && errorData?.conflicts && errorData.conflicts.length > 0) {
        setSwapTargetCourse({ id: course.id, name: course.course_name })
        setSwapConflicts(errorData.conflicts)
        setSwapContext({ timetableId, semester: selectedSemester })
        setIsSwapDialogOpened(true)
        return
      }

      notifications.show({
        title: '加入失敗',
        message: typedError.message,
        color: 'red',
      })
    }
  }

  const handleConfirmSwap = async () => {
    if (!swapContext || !swapTargetCourse) return

    const conflictCourseIds = Array.from(new Set(swapConflicts.map((item) => item.conflictWithCourseId)))

    try {
      setIsSwapSubmitting(true)

      for (const conflictCourseId of conflictCourseIds) {
        await removeTimetableCourse(swapContext.timetableId, conflictCourseId)
      }

      await addTimetableCourse(swapContext.timetableId, swapTargetCourse.id)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE, swapContext.semester] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] }),
      ])

      notifications.show({
        title: '已完成交換',
        message: `已移除 ${conflictCourseIds.length} 門衝堂課，並加入 ${swapTargetCourse.name}`,
        color: 'green',
      })

      setIsSwapDialogOpened(false)
      setSwapTargetCourse(null)
      setSwapConflicts([])
      setSwapContext(null)
    } catch (error) {
      const typedError = error as ApiError
      notifications.show({
        title: '交換失敗',
        message: typedError.message,
        color: 'red',
      })
    } finally {
      setIsSwapSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Paper withBorder p='lg' radius='md'>
        <Text fw={600}>登入後即可使用收藏課表</Text>
        <Text c='dimmed' size='sm'>
          你可以先回到
          {' '}
          <Text component={Link} to='/' span inherit>
            首頁
          </Text>
          {' '}
          登入，再回來排課與檢查衝堂。
        </Text>
      </Paper>
    )
  }

  if (isSemestersLoading || isTimetableLoading) {
    return (
      <Paper withBorder p='lg' radius='md'>
        <Text>課表載入中...</Text>
      </Paper>
    )
  }

  if (semesterOptions.length === 0) {
    return (
      <Paper withBorder p='lg' radius='md'>
        <Text c='dimmed'>目前沒有可選學期。</Text>
      </Paper>
    )
  }

  return (
    <Stack gap='md'>
      <SwapConflictModal
        opened={isSwapDialogOpened}
        targetCourse={swapTargetCourse}
        conflicts={swapConflicts}
        addedCourseNameMap={addedCourseNameMap}
        isSubmitting={isSwapSubmitting}
        onClose={() => {
          setIsSwapDialogOpened(false)
          setSwapContext(null)
        }}
        onConfirm={handleConfirmSwap}
      />

      <Paper withBorder p='md' radius='md'>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <Text fw={700}>學期課表</Text>
            <Text c='dimmed' size='sm'>
              課表只顯示選定學期，並限制只能加入同學期的收藏課程。
            </Text>
          </div>
          <Group align='center' gap='sm'>
            <Text size='sm' fw={600}>排課學期</Text>
            <Select
              className={styles.semesterSelect}
              placeholder='選擇學期'
              data={semesterOptions}
              value={selectedSemester}
              onChange={setSelectedSemester}
              allowDeselect={false}
              disabled={isSwapDialogOpened}
              aria-label='排課學期'
            />
          </Group>
        </div>

        <Group mt='sm' gap='xs'>
          <Badge variant='light' color='red'>
            已排課程 {items.length}
          </Badge>
          <Badge variant='light' color='green'>
            可加入收藏課 {selectableInterestCourses.length}
          </Badge>
          <Badge variant='light' color={missingTimeslotCountInCurrentSemester > 0 ? 'orange' : 'gray'}>
            缺時段課程 {missingTimeslotCountInCurrentSemester}
          </Badge>
        </Group>

        <div className={styles.listGrid}>
          <div className={`${styles.listPanel} ${styles.favoritePanel}`}>
            <Group justify='space-between' mb='xs'>
              <Text fw={600}>本學期收藏（可加入）</Text>
              <Badge variant='light' color='green'>{selectableInterestCourses.length}</Badge>
            </Group>
            {selectableInterestCourses.length === 0 ? (
              <Text size='sm' c='dimmed'>這個學期沒有可加入的收藏課程，或都已加入課表。</Text>
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
                        loading={addCourseMutation.isPending}
                        onClick={() => {
                          void handleAddCourse(course)
                        }}
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
              <Text size='sm' c='dimmed'>目前此學期課表沒有課程。</Text>
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
                        loading={removeCourseMutation.isPending}
                        onClick={() => {
                          if (!selectedSemester) return
                          removeCourseMutation.mutate({
                            timetableId: item.timetableId,
                            courseId: item.course.id,
                            semester: selectedSemester,
                          })
                        }}
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
      </Paper>

      {conflicts.length > 0 && (
        <Alert color='red' title='目前課表有撞課'>
          <Stack gap={4}>
            {conflicts.slice(0, 6).map((conflict) => (
              <Text key={`${conflict.dayLabel}-${conflict.period}`} size='sm'>
                星期{conflict.dayLabel} 第{conflict.period}節：{conflict.courses.join(' / ')}
              </Text>
            ))}
            <Text size='sm' c='dimmed'>
              缺時段課程 {missingTimeslotCountInCurrentSemester} 門，不參與衝堂判斷。
            </Text>
            {conflicts.length > 6 && (
              <Text size='sm' c='dimmed'>
                還有 {conflicts.length - 6} 個衝堂時段...
              </Text>
            )}
          </Stack>
        </Alert>
      )}

      {conflicts.length === 0 && missingTimeslotCountInCurrentSemester > 0 && (
        <Alert color='orange' title='缺少時段資料'>
          <Text size='sm'>
            本學期有 {missingTimeslotCountInCurrentSemester} 門課缺少時段資料，這些課程不會顯示在課表格，也不參與衝堂判斷。
          </Text>
        </Alert>
      )}

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
                      {periodTimeMap[period]}
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

    </Stack>
  )
}

export default Timetable

