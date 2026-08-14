import { useEffect, useMemo, useState } from 'react'
import { Collapse, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'

import periodTimeMap from '../../utils/periodTimeMap'
import { useAuthStore } from '../../stores/authStore'
import { useGetSemesters } from '../../hooks/semesters/useGetSemesters'
import { useGetTimetable } from '../../hooks/timetables/useGetTimetable'
import { useRemoveTimetableCourse } from '../../hooks/timetables/useRemoveTimetableCourse'
import { useAddTimetableCourse } from '../../hooks/timetables/useAddTimetableCourse'
import { useGetTimetableInterestOptions } from '../../hooks/timetables/useGetTimetableInterestOptions'
import { useGetAllTimetableItems } from '../../hooks/timetables/useGetAllTimetableItems'
import { AddedCourseItem, TimetableConflict, TimetableItem } from '../../types/timetableType'
import { swapTimetableCourse } from '../../apis/timetableAPI'
import { ApiError } from '../../apis/axiosInstance'
import { QUERY_KEYS } from '../../hooks/queryKeys'
import styles from '../../styles/components/Timetable.module.css'
import AuthButton from '../AuthButton'

import SwapConflictModal from './SwapConflictModal'
import TimetableHeader from './TimetableHeader'
import TimetableCourseLists from './TimetableCourseLists'
import TimetableGridTable from './TimetableGridTable'
import { SelectableInterestCourse, TimetableGrid, Weekday, WeekdayOption } from './types'

type PeriodKey = keyof typeof periodTimeMap

const weekdays: WeekdayOption[] = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 },
]
const EMPTY_TIMETABLE_ITEMS: TimetableItem[] = []
const EMPTY_ADDED_ITEMS: AddedCourseItem[] = []
const EWANT_DEPARTMENT = '校外遠距(EWANT)'

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
  const [isCourseListCollapsed, setIsCourseListCollapsed] = useState(true)
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

  const items = timetableData?.items ?? EMPTY_TIMETABLE_ITEMS
  const allAddedItems = allAddedItemsData?.items ?? EMPTY_ADDED_ITEMS
  const addedItemsInSelectedSemester = useMemo(() => {
    if (!selectedSemester) return []
    return allAddedItems.filter((item) => item.semester === selectedSemester)
  }, [allAddedItems, selectedSemester])
  const ewantItemsInSelectedSemester = useMemo(
    () => addedItemsInSelectedSemester.filter((item) => item.course.department === EWANT_DEPARTMENT),
    [addedItemsInSelectedSemester],
  )
  const scheduledItemsInSelectedSemester = useMemo(
    () => addedItemsInSelectedSemester.filter((item) => item.course.department !== EWANT_DEPARTMENT),
    [addedItemsInSelectedSemester],
  )
  const gridItems = useMemo(
    () => items.filter((item) => item.course.department !== EWANT_DEPARTMENT),
    [items],
  )
  const timetableId = timetableData?.timetable.id
  const grid = useMemo(() => buildGrid(gridItems), [gridItems])
  const missingTimeslotCountInCurrentSemester = useMemo(
    () => items.filter((item) => item.course.department !== EWANT_DEPARTMENT && item.timeslots.length === 0).length,
    [items],
  )
  const existingCourseIdSet = useMemo(() => new Set(items.map((item) => item.course.id)), [items])
  const selectableInterestCourses = useMemo<SelectableInterestCourse[]>(() => {
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
    () => gridItems.some((item) => item.timeslots.some((timeslot) => timeslot.dayOfWeek === 6 || timeslot.dayOfWeek === 7)),
    [gridItems],
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

  const handleAddCourse = async (course: SelectableInterestCourse) => {
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
      }
    }
  }

  const handleConfirmSwap = async () => {
    if (!swapContext || !swapTargetCourse) return

    try {
      setIsSwapSubmitting(true)

      const result = await swapTimetableCourse(swapContext.timetableId, swapTargetCourse.id)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE, swapContext.semester] }),
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] }),
      ])

      if (result.alreadyExists) {
        notifications.show({
          title: '課程已在課表中',
          message: `${swapTargetCourse.name} 已存在，未調整原有課表。`,
          color: 'blue',
        })
      } else {
        notifications.show({
          title: '已完成交換',
          message: `已移除 ${result.removedCourseIds.length} 門衝堂課，並加入 ${swapTargetCourse.name}`,
          color: 'green',
        })
      }

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

  if (isAuthenticated && (isSemestersLoading || isTimetableLoading)) {
    return (
      <div className={styles.card}>
        <Text>課表載入中...</Text>
      </div>
    )
  }

  if (isAuthenticated && semesterOptions.length === 0) {
    return (
      <div className={styles.card}>
        <Text c='dimmed'>目前沒有可選學期。</Text>
      </div>
    )
  }

  return (
    <div className={styles.timetableLockWrapper}>
      <Stack gap='md' className={!isAuthenticated ? styles.timetableLockedContent : undefined}>
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

      <div className={styles.card}>
        <TimetableHeader
          semesterOptions={semesterOptions}
          selectedSemester={selectedSemester}
          onSemesterChange={setSelectedSemester}
          isDisabled={isSwapDialogOpened || !isAuthenticated}
          itemsCount={items.length}
          selectableCount={selectableInterestCourses.length}
          missingTimeslotCount={missingTimeslotCountInCurrentSemester}
          ewantCount={ewantItemsInSelectedSemester.length}
          collapsed={isCourseListCollapsed}
          onToggleCollapse={() => setIsCourseListCollapsed((v) => !v)}
        />

        <Collapse in={!isCourseListCollapsed}>
          <TimetableCourseLists
            selectableInterestCourses={selectableInterestCourses}
            addedItemsInSelectedSemester={scheduledItemsInSelectedSemester}
            ewantItemsInSelectedSemester={ewantItemsInSelectedSemester}
            isAdding={addCourseMutation.isPending}
            isRemoving={removeCourseMutation.isPending}
            onAddCourse={(course) => {
              void handleAddCourse(course)
            }}
            onRemoveCourse={(item) => {
              if (!selectedSemester) return
              removeCourseMutation.mutate({
                timetableId: item.timetableId,
                courseId: item.course.id,
                semester: selectedSemester,
              })
            }}
          />
        </Collapse>
      </div>

      {conflicts.length > 0 && (
        <div className={`${styles.alert} ${styles.alertRed}`}>
          <Text fw={700} size='sm' className={styles.alertTitle}>目前課表有撞課</Text>
          <Stack gap={4}>
            {conflicts.slice(0, 6).map((conflict) => (
              <Text key={`${conflict.dayLabel}-${conflict.period}`} size='sm'>
                星期{conflict.dayLabel} 第{conflict.period}節：{conflict.courses.join(' / ')}
              </Text>
            ))}
            {missingTimeslotCountInCurrentSemester > 0 && (
              <Text size='sm' c='dimmed'>
                缺時段課程 {missingTimeslotCountInCurrentSemester} 門，不參與衝堂判斷。
              </Text>
            )}
            {ewantItemsInSelectedSemester.length > 0 && (
              <Text size='sm' c='dimmed'>
                遠距課程 {ewantItemsInSelectedSemester.length} 門，已移到下方獨立區塊，不顯示在時間格中。
              </Text>
            )}
            {conflicts.length > 6 && (
              <Text size='sm' c='dimmed'>
                還有 {conflicts.length - 6} 個衝堂時段...
              </Text>
            )}
          </Stack>
        </div>
      )}

      {conflicts.length === 0 && missingTimeslotCountInCurrentSemester > 0 && (
        <div className={`${styles.alert} ${styles.alertOrange}`}>
          <Text fw={700} size='sm' className={styles.alertTitle}>缺少時段資料</Text>
          <Text size='sm'>
            本學期有 {missingTimeslotCountInCurrentSemester} 門課資料較舊，平台尚未更新時段資料。這些課程不會顯示在課表格，也不參與衝堂判斷。
          </Text>
        </div>
      )}

      {ewantItemsInSelectedSemester.length > 0 && (
        <div className={`${styles.alert} ${styles.alertBlue}`}>
          <Text fw={700} size='sm' className={styles.alertTitle}>遠距課程已獨立顯示</Text>
          <Text size='sm'>
            本學期有 {ewantItemsInSelectedSemester.length} 門 EWANT 遠距課程，已集中顯示在「遠距課程」區塊，不會直接排進時間格，也不參與衝堂判斷。
          </Text>
        </div>
      )}

      <TimetableGridTable
        periodOrder={periodOrder}
        weekdaysToRender={weekdaysToRender}
        grid={grid}
      />
      </Stack>

      {!isAuthenticated && (
        <div className={styles.timetableLoginOverlay}>
          <div className={styles.timetableOverlayInner}>
            <div className={styles.overlayCard}>
              <Text fw={700}>登入後即可使用排課表功能</Text>
              <Text c='dimmed' size='sm'>
                登入後，即可使用排課、檢查衝堂，並依當前時段提示目前所在欄位，提醒上課時間。
              </Text>
              <AuthButton className={styles.timetableOverlayAuthButton} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Timetable
