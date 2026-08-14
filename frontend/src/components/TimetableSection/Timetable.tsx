import { useEffect, useMemo, useState } from 'react'
import { Button, Collapse, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FaLaptop } from 'react-icons/fa'

import { useAuthStore } from '../../stores/authStore'
import { useGetSemesters } from '../../hooks/semesters/useGetSemesters'
import { useGetTimetable } from '../../hooks/timetables/useGetTimetable'
import { useRemoveTimetableCourse } from '../../hooks/timetables/useRemoveTimetableCourse'
import { useGetAllTimetableItems } from '../../hooks/timetables/useGetAllTimetableItems'
import { useGuestTimetable } from '../../hooks/timetables/useGuestTimetable'
import { AddedCourseItem, TimetableGridCell, TimetableItem } from '../../types/timetableType'
import {
  buildTimetableGrid,
  countMissingTimeslotCourses,
  hasWeekendCourses,
  isEwantCourse,
  TIMETABLE_PERIOD_ORDER,
} from '../../utils/timetable'
import { getUserCacheScope } from '../../utils/userCacheScope'
import styles from '../../styles/components/Timetable.module.css'
import ConfirmModal from '../ConfirmModal'

import TimetableHeader from './TimetableHeader'
import TimetableCourseLists from './TimetableCourseLists'
import TimetableGridTable from './TimetableGridTable'
import {
  TimetableListItem,
  TimetableSlotSelection,
  Weekday,
  WeekdayOption,
} from './types'
import TimetablePlannerModal from './TimetablePlannerModal'

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

type ClearGuestSemesterSnapshot = {
  semester: string
  courseIds: number[]
}

const parseSemester = (semester: string): { year: number; term: number } | null => {
  const match = semester.trim().match(/^(\d+)\s*[-_/]\s*(\d+)$/)
  if (!match) return null
  return { year: Number(match[1]), term: Number(match[2]) }
}

const compareSemestersDescending = (first: string, second: string): number => {
  const parsedFirst = parseSemester(first)
  const parsedSecond = parseSemester(second)

  if (parsedFirst && parsedSecond) {
    if (parsedFirst.year !== parsedSecond.year) return parsedSecond.year - parsedFirst.year
    if (parsedFirst.term !== parsedSecond.term) return parsedSecond.term - parsedFirst.term
  } else if (parsedFirst) {
    return -1
  } else if (parsedSecond) {
    return 1
  }

  return second.localeCompare(first)
}

const Timetable: React.FC = () => {
  const { isAuthenticated, isAuthResolved } = useAuthStore()
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
  const {
    data: semestersData,
    isLoading: isSemestersLoading,
    isError: hasSemestersError,
  } = useGetSemesters()
  const guestTimetable = useGuestTimetable()

  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [isCourseListCollapsed, setIsCourseListCollapsed] = useState(true)
  const [clearGuestSemesterSnapshot, setClearGuestSemesterSnapshot] =
    useState<ClearGuestSemesterSnapshot | null>(null)
  const [isPlannerOpened, setIsPlannerOpened] = useState(false)
  const [plannerInitialSlot, setPlannerInitialSlot] = useState<TimetableSlotSelection | null>(null)
  const [isGuestMutationPending, setIsGuestMutationPending] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<TimetableListItem | null>(null)

  useEffect(() => {
    setRemoveTarget(null)
    setClearGuestSemesterSnapshot(null)
    setIsPlannerOpened(false)
    setPlannerInitialSlot(null)
  }, [isAuthenticated, userCacheScope])

  const {
    data: allAddedItemsData,
    isError: hasAllAddedItemsError,
    refetch: refetchAllAddedItems,
  } = useGetAllTimetableItems(isAuthenticated)
  const allAddedItems = allAddedItemsData?.items ?? EMPTY_ADDED_ITEMS
  const accountSemesters = useMemo(
    () => allAddedItems.map((item) => item.semester),
    [allAddedItems],
  )
  const semesterOptions = useMemo(() => {
    const extraSemesters = isAuthenticated ? accountSemesters : guestTimetable.semesters
    const semesters = Array.from(new Set([
      ...(semestersData?.items ?? []),
      ...extraSemesters,
    ])).sort(compareSemestersDescending)

    return semesters.map((semester) => ({ value: semester, label: semester }))
  }, [accountSemesters, guestTimetable.semesters, isAuthenticated, semestersData])

  useEffect(() => {
    if (semesterOptions.length === 0) {
      if (selectedSemester !== null) setSelectedSemester(null)
      return
    }

    const selectedSemesterExists = semesterOptions.some(
      (semester) => semester.value === selectedSemester,
    )
    if (!selectedSemesterExists) setSelectedSemester(semesterOptions[0].value)
  }, [selectedSemester, semesterOptions])

  const {
    data: timetableData,
    isLoading: isTimetableLoading,
    isError: hasTimetableError,
    refetch: refetchTimetable,
  } = useGetTimetable(selectedSemester, isAuthenticated)
  const removeCourseMutation = useRemoveTimetableCourse()

  const guestItems = selectedSemester
    ? guestTimetable.getItemsBySemester(selectedSemester)
    : EMPTY_TIMETABLE_ITEMS
  const items = isAuthenticated
    ? timetableData?.items ?? EMPTY_TIMETABLE_ITEMS
    : guestItems

  const listItems = useMemo<TimetableListItem[]>(() => {
    if (!selectedSemester) return []

    if (isAuthenticated) {
      return allAddedItems.filter((item) => item.semester === selectedSemester)
    }

    return guestItems.map((item) => ({
      semester: item.course.semester,
      hasTimeslots: item.timeslots.length > 0,
      course: item.course,
    }))
  }, [allAddedItems, guestItems, isAuthenticated, selectedSemester])

  const ewantItemsInSelectedSemester = useMemo(
    () => listItems.filter((item) => isEwantCourse(item.course)),
    [listItems],
  )
  const scheduledItemsInSelectedSemester = useMemo(
    () => listItems.filter((item) => !isEwantCourse(item.course)),
    [listItems],
  )
  const gridItems = useMemo(
    () => items.filter((item) => !isEwantCourse(item.course)),
    [items],
  )
  const grid = useMemo(() => buildTimetableGrid(gridItems), [gridItems])
  const missingTimeslotCountInCurrentSemester = useMemo(
    () => countMissingTimeslotCourses(items),
    [items],
  )

  const conflicts = useMemo(
    () => TIMETABLE_PERIOD_ORDER.flatMap((period) =>
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
        .filter((item): item is {
          dayLabel: Weekday
          period: (typeof TIMETABLE_PERIOD_ORDER)[number]
          courses: string[]
        } => item !== null),
    ),
    [grid],
  )
  const weekdaysToRender = useMemo(
    () => hasWeekendCourses(gridItems)
      ? weekdays
      : weekdays.filter((day) => day.value <= 5),
    [gridItems],
  )

  const handleGridCourseClick = (course: TimetableGridCell): void => {
    if (!selectedSemester) return

    const item = items.find((currentItem) => currentItem.course.id === course.courseId)
    if (!item) return

    setRemoveTarget({
      timetableId: isAuthenticated ? timetableData?.timetable.id : undefined,
      semester: selectedSemester,
      hasTimeslots: item.timeslots.length > 0,
      course: item.course,
    })
  }

  const handleEmptySlotClick = (slot: TimetableSlotSelection): void => {
    setPlannerInitialSlot(slot)
    setIsPlannerOpened(true)
  }

  const handleConfirmRemoveCourse = async (): Promise<void> => {
    if (!selectedSemester || !removeTarget) return

    if (isAuthenticated) {
      if (!removeTarget.timetableId) return
      removeCourseMutation.mutate({
        timetableId: removeTarget.timetableId,
        courseId: removeTarget.course.id,
        semester: selectedSemester,
      }, {
        onSuccess: () => setRemoveTarget(null),
      })
      return
    }

    if (removeTarget.timetableId) {
      setRemoveTarget(null)
      return
    }

    try {
      setIsGuestMutationPending(true)
      const removed = await guestTimetable.removeCourse(selectedSemester, removeTarget.course.id)
      if (removed) {
        notifications.show({
          title: '已移除課程',
          message: '課程已從本機課表移除',
          color: 'green',
        })
      }
      setRemoveTarget(null)
    } catch (error) {
      notifications.show({
        title: '移除失敗',
        message: error instanceof Error ? error.message : '無法更新本機課表',
        color: 'red',
      })
    } finally {
      setIsGuestMutationPending(false)
    }
  }

  const handleClearGuestSemester = async (): Promise<void> => {
    if (!clearGuestSemesterSnapshot || isAuthenticated) return

    try {
      setIsGuestMutationPending(true)
      const clearResult = await guestTimetable.clearSemester(
        clearGuestSemesterSnapshot.semester,
        clearGuestSemesterSnapshot.courseIds,
      )
      if (clearResult !== 'cleared') {
        setClearGuestSemesterSnapshot(null)
        notifications.show({
          title: clearResult === 'already-empty' ? '課表已清空' : '本機課表已變更',
          message: clearResult === 'already-empty'
            ? '這學期的本機課表已在其他分頁清空。'
            : '其他分頁已更新這學期的課表，請重新確認後再清空。',
          color: clearResult === 'already-empty' ? 'blue' : 'orange',
        })
        return
      }
      notifications.show({
        title: '已清空課表',
        message: `已清空 ${clearGuestSemesterSnapshot.semester} 的本機課表，其他學期不受影響。`,
        color: 'green',
      })
      setClearGuestSemesterSnapshot(null)
    } catch (error) {
      notifications.show({
        title: '清空失敗',
        message: error instanceof Error ? error.message : '無法清空本機課表',
        color: 'red',
      })
    } finally {
      setIsGuestMutationPending(false)
    }
  }

  if (!isAuthResolved) {
    return (
      <div className={styles.card}>
        <Text>正在確認登入狀態...</Text>
      </div>
    )
  }

  if ((isSemestersLoading && semesterOptions.length === 0) || (isAuthenticated && isTimetableLoading)) {
    return (
      <div className={styles.card}>
        <Text>課表載入中...</Text>
      </div>
    )
  }

  if (semesterOptions.length === 0) {
    return (
      <div className={styles.card}>
        <Text c='dimmed'>
          {hasSemestersError ? '無法載入學期資料，請稍後再試。' : '目前沒有可選學期。'}
        </Text>
      </div>
    )
  }

  return (
    <>
      <ConfirmModal
        opened={clearGuestSemesterSnapshot !== null}
        onClose={() => setClearGuestSemesterSnapshot(null)}
        title='清空目前學期課表？'
        message={`只會清空 ${clearGuestSemesterSnapshot?.semester ?? '目前學期'} 的本機課表，不影響其他學期或收藏資料。`}
        confirmText='清空課表'
        cancelText='取消'
        loading={isGuestMutationPending}
        onConfirm={handleClearGuestSemester}
      />

      <ConfirmModal
        opened={removeTarget !== null}
        onClose={() => {
          if (!isGuestMutationPending && !removeCourseMutation.isPending) {
            setRemoveTarget(null)
          }
        }}
        title='從課表移除課程？'
        message={`確定要從 ${selectedSemester ?? '目前學期'} 課表移除整門「${removeTarget?.course.name ?? ''}」嗎？`}
        confirmText='移除課程'
        cancelText='取消'
        loading={isGuestMutationPending || removeCourseMutation.isPending}
        onConfirm={handleConfirmRemoveCourse}
      />

      <TimetablePlannerModal
        opened={isPlannerOpened}
        onClose={() => setIsPlannerOpened(false)}
        semester={selectedSemester}
        initialSlot={plannerInitialSlot}
      />

      <Stack gap='md'>
        {!isAuthenticated && (
          <div className={styles.localTimetableNotice}>
            <div className={styles.localTimetableNoticeIcon} aria-hidden='true'>
              <FaLaptop size={18} />
            </div>
            <div className={styles.localTimetableNoticeContent}>
              <Text fw={800} size='sm'>
                這份課表保存在此裝置
              </Text>
              <Text size='xs' c='dimmed'>
                訪客模式不會寫入帳號；登入後可選擇保存，並跨裝置同步。
              </Text>
            </div>
          </div>
        )}

        {guestTimetable.error && !isAuthenticated && (
          <div className={`${styles.alert} ${styles.alertRed}`}>
            <Text fw={700} size='sm' className={styles.alertTitle}>無法讀取本機課表</Text>
            <Text size='sm'>{guestTimetable.error.message}</Text>
          </div>
        )}

        {isAuthenticated && (hasAllAddedItemsError || hasTimetableError) && (
          <div className={`${styles.alert} ${styles.alertRed}`}>
            <Text fw={700} size='sm' className={styles.alertTitle}>帳號課表載入不完整</Text>
            <Text size='sm'>目前清單或課表格可能不是最新資料，請重試後再進行調整。</Text>
            <Button
              size='xs'
              variant='light'
              color='red'
              mt='xs'
              onClick={() => void Promise.all([refetchAllAddedItems(), refetchTimetable()])}
            >
              重新載入
            </Button>
          </div>
        )}

        <div className={styles.card}>
          <TimetableHeader
            semesterOptions={semesterOptions}
            selectedSemester={selectedSemester}
            onSemesterChange={setSelectedSemester}
            isDisabled={isGuestMutationPending || removeCourseMutation.isPending}
            isGuest={!isAuthenticated}
            itemsCount={items.length}
            missingTimeslotCount={missingTimeslotCountInCurrentSemester}
            ewantCount={ewantItemsInSelectedSemester.length}
            collapsed={isCourseListCollapsed}
            onToggleCollapse={() => setIsCourseListCollapsed((isCollapsed) => !isCollapsed)}
            onClearGuestSemester={() => {
              if (!selectedSemester) return
              setClearGuestSemesterSnapshot({
                semester: selectedSemester,
                courseIds: guestItems.map((item) => item.course.id),
              })
            }}
            onOpenCourseSearch={() => {
              setPlannerInitialSlot(null)
              setIsPlannerOpened(true)
            }}
          />

          <Collapse in={!isCourseListCollapsed}>
            <TimetableCourseLists
              addedItemsInSelectedSemester={scheduledItemsInSelectedSemester}
              ewantItemsInSelectedSemester={ewantItemsInSelectedSemester}
              isRemoving={isGuestMutationPending || removeCourseMutation.isPending}
              onRemoveCourse={setRemoveTarget}
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
                  遠距課程 {ewantItemsInSelectedSemester.length} 門，已移到獨立區塊，不顯示在時間格中。
                </Text>
              )}
              {conflicts.length > 6 && (
                <Text size='sm' c='dimmed'>還有 {conflicts.length - 6} 個衝堂時段...</Text>
              )}
            </Stack>
          </div>
        )}

        {conflicts.length === 0 && missingTimeslotCountInCurrentSemester > 0 && (
          <div className={`${styles.alert} ${styles.alertOrange}`}>
            <Text fw={700} size='sm' className={styles.alertTitle}>缺少時段資料</Text>
            <Text size='sm'>
              本學期有 {missingTimeslotCountInCurrentSemester} 門課缺少時段資料。這些課程不會顯示在課表格，也不參與衝堂判斷。
            </Text>
          </div>
        )}

        {ewantItemsInSelectedSemester.length > 0 && (
          <div className={`${styles.alert} ${styles.alertBlue}`}>
            <Text fw={700} size='sm' className={styles.alertTitle}>遠距課程已獨立顯示</Text>
            <Text size='sm'>
              本學期有 {ewantItemsInSelectedSemester.length} 門 EWANT 遠距課程，已集中顯示在「遠距課程」區塊，不會排進時間格，也不參與衝堂判斷。
            </Text>
          </div>
        )}

        <Stack gap='xs'>
          <Text size='sm' c='dimmed'>點擊課程可查看評價或確認移除；點擊空白格的＋可搜尋這個時段的課程。</Text>
          <TimetableGridTable
            periodOrder={TIMETABLE_PERIOD_ORDER}
            weekdaysToRender={weekdaysToRender}
            grid={grid}
            onCourseClick={handleGridCourseClick}
            onEmptySlotClick={handleEmptySlotClick}
            isCourseActionDisabled={isGuestMutationPending || removeCourseMutation.isPending}
          />
        </Stack>
      </Stack>
    </>
  )
}

export default Timetable
