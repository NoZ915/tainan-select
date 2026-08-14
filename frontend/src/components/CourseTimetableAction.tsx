import { useEffect, useState } from 'react'
import { Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FaCalendarPlus, FaTrashAlt } from 'react-icons/fa'

import { useGetAllTimetableItems } from '../hooks/timetables/useGetAllTimetableItems'
import { useGuestTimetable } from '../hooks/timetables/useGuestTimetable'
import { useRemoveTimetableCourse } from '../hooks/timetables/useRemoveTimetableCourse'
import { useAuthStore } from '../stores/authStore'
import type { CourseDetailResponse } from '../types/courseType'
import type { AddedCourseItem } from '../types/timetableType'
import { getUserCacheScope } from '../utils/userCacheScope'

import ConfirmModal from './ConfirmModal'
import TimetablePlannerModal from './TimetableSection/TimetablePlannerModal'

type CourseTimetableActionProps = {
  course: CourseDetailResponse | null | undefined
  isLoading: boolean
  hasError: boolean
}

const EMPTY_ADDED_ITEMS: AddedCourseItem[] = []

type RemoveConfirmation = {
  courseId: number
  courseName: string
  semester: string
  userCacheScope: string
} & (
  | { mode: 'account'; timetableId: number }
  | { mode: 'guest' }
)

const CourseTimetableAction: React.FC<CourseTimetableActionProps> = ({
  course,
  isLoading,
  hasError,
}) => {
  const { isAuthenticated, isAuthResolved } = useAuthStore()
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
  const guestTimetable = useGuestTimetable()
  const removeCourseMutation = useRemoveTimetableCourse()
  const {
    data: allAddedItemsData,
    isFetching: isAccountItemsFetching,
    isError: hasAccountItemsError,
    refetch: refetchAccountItems,
  } =
    useGetAllTimetableItems(isAuthenticated)
  const [isPlannerOpened, setIsPlannerOpened] = useState(false)
  const [removeConfirmation, setRemoveConfirmation] = useState<RemoveConfirmation | null>(null)
  const [isGuestRemovePending, setIsGuestRemovePending] = useState(false)

  const courseData = course?.course
  const accountItems = allAddedItemsData?.items ?? EMPTY_ADDED_ITEMS
  const accountAddedItem = courseData
    ? accountItems.find(
      (item) => item.semester === courseData.semester && item.course.id === courseData.id,
    )
    : undefined
  const isAlreadyAdded = isAuthResolved && courseData ? (
    isAuthenticated
      ? Boolean(accountAddedItem)
      : guestTimetable.isCourseAdded(courseData.semester, courseData.id)
  ) : false
  const isCourseUnavailable = !courseData && (hasError || !isLoading)
  const isCheckingAccountItems = isAuthenticated && isAccountItemsFetching
  const isRemoving = isGuestRemovePending || removeCourseMutation.isPending
  const isButtonLoading = isLoading || !isAuthResolved || isCheckingAccountItems || isRemoving

  useEffect(() => {
    if (!removeConfirmation || isRemoving) return

    const modeStillMatches = isAuthResolved
      && removeConfirmation.userCacheScope === userCacheScope
      && (removeConfirmation.mode === 'account') === isAuthenticated

    if (!modeStillMatches) setRemoveConfirmation(null)
  }, [
    isAuthenticated,
    isAuthResolved,
    isRemoving,
    removeConfirmation,
    userCacheScope,
  ])

  let buttonLabel = courseData?.semester
    ? `加入 ${courseData.semester} 課表`
    : '加入課表'
  if (isCourseUnavailable) buttonLabel = '課程資料載入失敗'
  else if (!isAuthResolved) buttonLabel = '確認登入狀態...'
  else if (isLoading || isCheckingAccountItems) buttonLabel = '確認課表狀態...'
  else if (isAuthenticated && hasAccountItemsError) buttonLabel = '重新載入課表狀態'
  else if (!isAuthenticated && guestTimetable.error) buttonLabel = '無法讀取本機課表'
  else if (isAlreadyAdded) buttonLabel = `從 ${courseData?.semester ?? ''} 課表移除`

  const handleButtonClick = (): void => {
    if (isAuthenticated && hasAccountItemsError) {
      void refetchAccountItems()
      return
    }

    if (isAlreadyAdded) {
      if (!courseData || !isAuthResolved) return

      if (isAuthenticated) {
        if (!accountAddedItem) return
        setRemoveConfirmation({
          mode: 'account',
          timetableId: accountAddedItem.timetableId,
          courseId: courseData.id,
          courseName: courseData.course_name,
          semester: courseData.semester,
          userCacheScope,
        })
      } else {
        setRemoveConfirmation({
          mode: 'guest',
          courseId: courseData.id,
          courseName: courseData.course_name,
          semester: courseData.semester,
          userCacheScope,
        })
      }
      return
    }
    setIsPlannerOpened(true)
  }

  const handleConfirmRemove = async (): Promise<void> => {
    if (!removeConfirmation) return

    const currentAuthState = useAuthStore.getState()
    const currentUserCacheScope = getUserCacheScope(currentAuthState.user)
    const modeStillMatches = currentAuthState.isAuthResolved
      && removeConfirmation.userCacheScope === currentUserCacheScope
      && (removeConfirmation.mode === 'account') === currentAuthState.isAuthenticated

    if (!modeStillMatches) {
      setRemoveConfirmation(null)
      notifications.show({
        title: '登入狀態已變更',
        message: '請重新確認課表狀態後再操作。',
        color: 'blue',
      })
      return
    }

    if (removeConfirmation.mode === 'account') {
      removeCourseMutation.mutate({
        timetableId: removeConfirmation.timetableId,
        courseId: removeConfirmation.courseId,
        semester: removeConfirmation.semester,
      }, {
        onSuccess: () => setRemoveConfirmation(null),
      })
      return
    }

    try {
      setIsGuestRemovePending(true)
      const removed = await guestTimetable.removeCourse(
        removeConfirmation.semester,
        removeConfirmation.courseId,
      )
      notifications.show({
        title: removed ? '已移除課程' : '課程已不在課表中',
        message: removed ? '課程已從本機課表移除' : '本機課表不需要再調整',
        color: removed ? 'green' : 'blue',
      })
      setRemoveConfirmation(null)
    } catch (error) {
      notifications.show({
        title: '移除失敗',
        message: error instanceof Error ? error.message : '無法更新本機課表',
        color: 'red',
      })
    } finally {
      setIsGuestRemovePending(false)
    }
  }

  return (
    <>
      <Button
        fullWidth
        variant={isAlreadyAdded ? 'light' : 'filled'}
        color={isAlreadyAdded ? 'red' : undefined}
        leftSection={isAlreadyAdded ? <FaTrashAlt size={15} /> : <FaCalendarPlus size={16} />}
        loading={isButtonLoading}
        disabled={
          isCourseUnavailable
          || !isAuthResolved
          || Boolean(guestTimetable.error && !isAuthenticated)
        }
        onClick={handleButtonClick}
      >
        {buttonLabel}
      </Button>

      <ConfirmModal
        opened={Boolean(removeConfirmation)}
        onClose={() => {
          if (!isRemoving) setRemoveConfirmation(null)
        }}
        title='從課表移除課程？'
        message={`確定要從 ${removeConfirmation?.semester ?? '目前學期'} 課表移除整門「${removeConfirmation?.courseName ?? ''}」嗎？`}
        confirmText='移除課程'
        cancelText='取消'
        loading={isRemoving}
        onConfirm={handleConfirmRemove}
        zIndex={1400}
      />

      <TimetablePlannerModal
        opened={isPlannerOpened}
        onClose={() => setIsPlannerOpened(false)}
        semester={courseData?.semester ?? null}
        initialCourse={course ?? null}
      />
    </>
  )
}

export default CourseTimetableAction
