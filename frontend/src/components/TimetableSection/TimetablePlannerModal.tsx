import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, WheelEvent } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  Pagination,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FaCalendarPlus, FaExternalLinkAlt, FaSearch, FaTrashAlt } from 'react-icons/fa'

import { addTimetableCourse, swapTimetableCourse } from '../../apis/timetableAPI'
import type { ApiError } from '../../apis/axiosInstance'
import { useGetCourses } from '../../hooks/courses/useGetCourses'
import { useGetAcademies } from '../../hooks/courses/useGetAcademies'
import { useGetDepartments } from '../../hooks/courses/useGetDepartments'
import { QUERY_KEYS } from '../../hooks/queryKeys'
import { useGuestTimetable } from '../../hooks/timetables/useGuestTimetable'
import { useGetTimetable } from '../../hooks/timetables/useGetTimetable'
import { useRemoveTimetableCourse } from '../../hooks/timetables/useRemoveTimetableCourse'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuthStore } from '../../stores/authStore'
import styles from '../../styles/components/Timetable.module.css'
import type {
  Course,
  CourseDetailResponse,
  FilterOption,
  SearchParams,
} from '../../types/courseType'
import type {
  AddedCourseItem,
  GuestTimetableItem,
  TimetableConflict,
  TimetableGridCell,
  TimetableItem,
  TimetableResponse,
  Timeslot,
} from '../../types/timetableType'
import { GuestTimetableStorageError } from '../../utils/guestTimetableStorage'
import {
  buildTimetableGrid,
  findConflictCourseIds,
  isEwantCourse,
  TIMETABLE_PERIOD_ORDER,
} from '../../utils/timetable'
import {
  captureAuthSessionEpoch,
  getUserCacheScope,
  isAuthenticatedUserCacheScopeCurrent,
} from '../../utils/userCacheScope'
import ConfirmModal from '../ConfirmModal'

import SwapConflictModal from './SwapConflictModal'
import TimetableGridTable from './TimetableGridTable'
import type { TimetableSlotSelection, WeekdayOption } from './types'

type TimetablePlannerModalProps = {
  opened: boolean
  onClose: () => void
  semester: string | null
  initialCourse?: CourseDetailResponse | null
  initialSlot?: TimetableSlotSelection | null
}

type PendingSwapBase = {
  item: GuestTimetableItem
  conflictCourseIds: number[]
}

type PendingSwap =
  | (PendingSwapBase & { mode: 'guest' })
  | (PendingSwapBase & { mode: 'account'; timetableId: number })

const EMPTY_TIMETABLE_ITEMS: TimetableItem[] = []

const plannerFilterOptions: FilterOption[] = [
  { label: '全部', value: 'all' },
  { label: '通識', value: 'general' },
  { label: '大學', value: 'university' },
  { label: '研究所', value: 'graduate' },
  { label: '師培', value: 'teacher' },
]

const courseTypeOptions = ['必修', '選修', '必選修']

const weekdays: WeekdayOption[] = [
  { label: '一', value: 1 },
  { label: '二', value: 2 },
  { label: '三', value: 3 },
  { label: '四', value: 4 },
  { label: '五', value: 5 },
  { label: '六', value: 6 },
  { label: '日', value: 7 },
]

const getWeekdayLabel = (dayOfWeek: number): string =>
  weekdays.find((day) => day.value === dayOfWeek)?.label ?? String(dayOfWeek)

const buildPlannerItem = (
  course: Course,
  timeslots: Timeslot[],
): GuestTimetableItem => ({
  course: {
    id: course.id,
    name: course.course_name,
    semester: course.semester,
    department: course.department,
    instructor: course.instructor,
    room: course.course_room ?? undefined,
    courseTime: course.course_time ?? undefined,
  },
  timeslots,
  addedAt: new Date().toISOString(),
})

const getConflictIdsFromApiError = (error: unknown): number[] => {
  if (!(error instanceof Error)) return []
  const apiError = error as ApiError
  if (apiError.status !== 409) return []

  const errorData = apiError.data as { conflicts?: TimetableConflict[] } | undefined
  if (!Array.isArray(errorData?.conflicts)) return []

  return Array.from(new Set(
    errorData.conflicts.map((conflict) => conflict.conflictWithCourseId),
  ))
}

const hasApiErrorCode = (error: unknown, code: string): boolean => {
  if (!(error instanceof Error)) return false
  const apiError = error as ApiError
  const errorData = apiError.data as { code?: unknown } | undefined
  return apiError.status === 409 && errorData?.code === code
}

const showGuestAddSuccess = (item: GuestTimetableItem): void => {
  const hasMissingTimeslots = !isEwantCourse(item.course) && item.timeslots.length === 0
  notifications.show({
    title: '已加入本機課表',
    message: hasMissingTimeslots
      ? '此課程缺少時段資料，已加入課表，但不參與衝堂判斷。此課表只保存在目前瀏覽器。'
      : '此課表只保存在目前瀏覽器。',
    color: hasMissingTimeslots ? 'orange' : 'green',
  })
}

const TimetablePlannerModal: React.FC<TimetablePlannerModalProps> = ({
  opened,
  onClose,
  semester,
  initialCourse = null,
  initialSlot = null,
}) => {
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const { isAuthenticated, isAuthResolved } = useAuthStore()
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
  const guestTimetable = useGuestTimetable()
  const removeCourseMutation = useRemoveTimetableCourse()

  const [searchInput, setSearchInput] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [category, setCategory] = useState('all')
  const [academy, setAcademy] = useState('')
  const [department, setDepartment] = useState('')
  const [courseType, setCourseType] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlotSelection | null>(initialSlot)
  const [addingCourseId, setAddingCourseId] = useState<number | null>(null)
  const [pendingSwap, setPendingSwap] = useState<PendingSwap | null>(null)
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false)
  const [failedCourseId, setFailedCourseId] = useState<number | null>(null)
  const [removeTarget, setRemoveTarget] = useState<TimetableItem | null>(null)
  const [isGuestRemovePending, setIsGuestRemovePending] = useState(false)
  const [initializedContextKey, setInitializedContextKey] = useState<string | null>(null)
  const [categoryTabOverflow, setCategoryTabOverflow] = useState({ left: false, right: false })
  const autoAddContextRef = useRef<string | null>(null)
  const addLockRef = useRef(false)
  const searchPaneRef = useRef<HTMLDivElement | null>(null)
  const categoryTabsListRef = useRef<HTMLDivElement | null>(null)

  const requestedContextKey = `${semester ?? ''}:${initialCourse?.course.id ?? ''}:${initialSlot?.dayOfWeek ?? ''}:${initialSlot?.period ?? ''}`

  useEffect(() => {
    if (!opened) {
      setInitializedContextKey(null)
      autoAddContextRef.current = null
      return
    }

    if (initializedContextKey === requestedContextKey) return

    setSearchInput('')
    setSubmittedSearch('')
    setSearchPage(1)
    setCategory('all')
    setAcademy('')
    setDepartment('')
    setCourseType('')
    setSelectedSlot(initialSlot)
    setPendingSwap(null)
    setFailedCourseId(null)
    setRemoveTarget(null)
    setInitializedContextKey(requestedContextKey)
  }, [initialSlot, initializedContextKey, opened, requestedContextKey])

  useEffect(() => {
    setPendingSwap(null)
    setFailedCourseId(null)
    setRemoveTarget(null)
  }, [isAuthenticated, userCacheScope])

  const searchParams = useMemo<SearchParams>(() => ({
    page: searchPage,
    limit: 5,
    search: submittedSearch,
    category,
    academy,
    department,
    courseType,
    weekdays: selectedSlot ? [String(selectedSlot.dayOfWeek)] : [],
    periods: selectedSlot ? [selectedSlot.period] : [],
    semesters: semester ? [semester] : [],
    sortBy: 'reviewDesc',
    includeTimeslots: true,
  }), [
    academy,
    category,
    courseType,
    department,
    searchPage,
    selectedSlot,
    semester,
    submittedSearch,
  ])

  const showOrganizationFilters = category === 'university' || category === 'graduate'
  const {
    data: academyList,
    isLoading: isLoadingAcademies,
    isError: hasAcademiesError,
  } = useGetAcademies(opened && showOrganizationFilters, {
    semester: semester ?? undefined,
    category,
  })
  const {
    data: departmentList,
    isLoading: isLoadingDepartments,
    isError: hasDepartmentsError,
  } = useGetDepartments(opened && showOrganizationFilters, {
    semester: semester ?? undefined,
    category,
    academy: academy || undefined,
  })

  const {
    data: courseSearchData,
    isFetching: isSearching,
    isError: hasSearchError,
    refetch: refetchCourseSearch,
  } = useGetCourses(
    searchParams,
    opened
      && Boolean(semester)
      && initializedContextKey === requestedContextKey,
  )
  const {
    data: accountTimetableData,
    isLoading: isAccountTimetableLoading,
    isError: hasAccountTimetableError,
    refetch: refetchAccountTimetable,
  } = useGetTimetable(semester, opened && isAuthenticated)

  const guestItems = semester
    ? guestTimetable.getItemsBySemester(semester)
    : EMPTY_TIMETABLE_ITEMS
  const existingItems = !isAuthResolved
    ? EMPTY_TIMETABLE_ITEMS
    : isAuthenticated
      ? accountTimetableData?.items ?? EMPTY_TIMETABLE_ITEMS
      : guestItems
  const grid = useMemo(() => buildTimetableGrid(existingItems), [existingItems])
  const weekdaysToRender = weekdays
  const offGridItems = useMemo(
    () => existingItems.filter(
      (item) => isEwantCourse(item.course) || item.timeslots.length === 0,
    ),
    [existingItems],
  )
  const addedCourseNameMap = useMemo(
    () => new Map(existingItems.map((item) => [item.course.id, item.course.name])),
    [existingItems],
  )
  const searchCourses = (courseSearchData?.courses ?? []).filter(
    (course) => course.semester === semester,
  )
  const initialPlannerItem = useMemo(
    () => initialCourse?.course
      && initialCourse.course.semester === semester
      && Array.isArray(initialCourse.timeslots)
      ? buildPlannerItem(initialCourse.course, initialCourse.timeslots)
      : null,
    [initialCourse, semester],
  )

  const invalidateAccountTimetable = useCallback(async (
    cacheScope = userCacheScope,
  ): Promise<void> => {
    if (!semester) return
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TIMETABLE, semester, cacheScope],
      }),
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS, cacheScope],
      }),
    ])
  }, [queryClient, semester, userCacheScope])

  const updateAccountTimetableCache = useCallback((
    timetableId: number,
    item: GuestTimetableItem,
    removedCourseIds: readonly number[] = [],
    cacheScope = userCacheScope,
  ): void => {
    const removedCourseIdSet = new Set(removedCourseIds)

    queryClient.setQueryData<TimetableResponse>(
      [QUERY_KEYS.TIMETABLE, item.course.semester, cacheScope],
      (current) => {
        if (!current) return current
        const retainedItems = current.items.filter(
          (currentItem) => currentItem.course.id !== item.course.id
            && !removedCourseIdSet.has(currentItem.course.id),
        )
        return { ...current, items: [...retainedItems, item] }
      },
    )

    const addedItem: AddedCourseItem = {
      timetableId,
      semester: item.course.semester,
      hasTimeslots: !isEwantCourse(item.course) && item.timeslots.length > 0,
      course: item.course,
    }
    queryClient.setQueryData<{ items: AddedCourseItem[] }>(
      [QUERY_KEYS.TIMETABLE_ALL_ITEMS, cacheScope],
      (current) => {
        if (!current) return current
        const retainedItems = current.items.filter(
          (currentItem) => !(
            currentItem.semester === item.course.semester
            && (
              currentItem.course.id === item.course.id
              || removedCourseIdSet.has(currentItem.course.id)
            )
          ),
        )
        return { items: [addedItem, ...retainedItems] }
      },
    )
  }, [queryClient, userCacheScope])

  const handleSearch = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    const normalizedSearch = searchInput.trim()
    if (normalizedSearch === submittedSearch) {
      if (searchPage !== 1) {
        setSearchPage(1)
        return
      }
      void refetchCourseSearch()
      return
    }
    setSearchPage(1)
    setSubmittedSearch(normalizedSearch)
  }

  const handleCategoryChange = (value: string | null): void => {
    const nextCategory = value ?? 'all'

    setCategory(nextCategory)
    setAcademy('')
    setDepartment('')
    setCourseType('')
    setSearchPage(1)
  }

  const handleAcademyChange = (value: string | null): void => {
    setAcademy(value ?? '')
    setDepartment('')
    setSearchPage(1)
  }

  const handleEmptySlotClick = (slot: TimetableSlotSelection): void => {
    setSelectedSlot(slot)
    setSearchPage(1)

    if (isMobile) {
      window.requestAnimationFrame(() => {
        searchPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const updateCategoryTabOverflow = useCallback((): void => {
    const tabsList = categoryTabsListRef.current
    if (!tabsList) return

    const maxScrollLeft = tabsList.scrollWidth - tabsList.clientWidth
    const nextOverflow = {
      left: tabsList.scrollLeft > 1,
      right: tabsList.scrollLeft < maxScrollLeft - 1,
    }
    setCategoryTabOverflow((currentOverflow) => (
      currentOverflow.left === nextOverflow.left
      && currentOverflow.right === nextOverflow.right
        ? currentOverflow
        : nextOverflow
    ))
  }, [])

  useEffect(() => {
    if (!opened) return

    const animationFrame = window.requestAnimationFrame(updateCategoryTabOverflow)
    const resizeObserver = new ResizeObserver(updateCategoryTabOverflow)
    if (categoryTabsListRef.current) resizeObserver.observe(categoryTabsListRef.current)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
    }
  }, [opened, updateCategoryTabOverflow])

  const handleCategoryTabsWheel = (event: WheelEvent<HTMLDivElement>): void => {
    const tabsList = event.currentTarget
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

    const maxScrollLeft = tabsList.scrollWidth - tabsList.clientWidth
    const canScroll = event.deltaY < 0
      ? tabsList.scrollLeft > 0
      : tabsList.scrollLeft < maxScrollLeft
    if (!canScroll) return

    event.preventDefault()
    tabsList.scrollLeft += event.deltaY
  }

  const handleAddCourse = useCallback(async (item: GuestTimetableItem): Promise<void> => {
    if (
      !semester
      || item.course.semester !== semester
      || addLockRef.current
      || !isAuthResolved
      || existingItems.some((currentItem) => currentItem.course.id === item.course.id)
    ) {
      return
    }

    addLockRef.current = true
    setAddingCourseId(item.course.id)
    setFailedCourseId(null)
    setPendingSwap(null)
    try {
      if (!isAuthenticated) {
        const conflictCourseIds = findConflictCourseIds(item, existingItems)
        if (conflictCourseIds.length > 0) {
          setPendingSwap({
            mode: 'guest',
            item,
            conflictCourseIds,
          })
          return
        }

        const result = await guestTimetable.addCourse(item)
        if (result.conflictCourseIds.length > 0) {
          setPendingSwap({
            mode: 'guest',
            item,
            conflictCourseIds: result.conflictCourseIds,
          })
          return
        }
        if (result.alreadyExists) {
          notifications.show({
            title: '已存在',
            message: '這門課已經在本機課表中',
            color: 'blue',
          })
        } else {
          showGuestAddSuccess(item)
        }
        return
      }

      const timetableId = accountTimetableData?.timetable.id
      if (!timetableId) {
        throw new Error('帳號課表尚未載入完成，請稍後再試。')
      }

      try {
        const requestUserCacheScope = getUserCacheScope(useAuthStore.getState().user)
        const requestAuthSessionEpoch = captureAuthSessionEpoch()
        const result = await addTimetableCourse(timetableId, item.course.id, {
          expectedSessionScope: requestUserCacheScope,
        })
        let guestCleanupFailed = false
        if (result.added || result.alreadyExists) {
          updateAccountTimetableCache(timetableId, item, [], requestUserCacheScope)
          void invalidateAccountTimetable(requestUserCacheScope)

          if (guestTimetable.isCourseAdded(item.course.semester, item.course.id)) {
            const isRequestSessionCurrent = () => isAuthenticatedUserCacheScopeCurrent(
              useAuthStore.getState(),
              requestUserCacheScope,
              requestAuthSessionEpoch,
            )
            if (!isRequestSessionCurrent()) {
              guestCleanupFailed = true
            } else {
              try {
                const removed = await guestTimetable.removeCourse(
                  item.course.semester,
                  item.course.id,
                  isRequestSessionCurrent,
                )
                if (!removed && !isRequestSessionCurrent()) guestCleanupFailed = true
              } catch {
                guestCleanupFailed = true
              }
            }
          }
        }
        notifications.show({
          title: result.alreadyExists ? '已存在' : '已加入課表',
          message: guestCleanupFailed
            ? '帳號課表已更新，但無法清除這門課的本機待處理資料。'
            : result.alreadyExists
              ? '這門課已經在課表中'
              : `課程已加入 ${semester} 課表`,
          color: guestCleanupFailed ? 'orange' : result.alreadyExists ? 'blue' : 'green',
        })
      } catch (error) {
        const conflictCourseIds = getConflictIdsFromApiError(error)
        if (conflictCourseIds.length > 0) {
          setPendingSwap({
            mode: 'account',
            item,
            timetableId,
            conflictCourseIds,
          })
          return
        }
        throw error
      }
    } catch (error) {
      setFailedCourseId(item.course.id)
      notifications.show({
        title: '加入失敗',
        message: error instanceof Error ? error.message : '發生錯誤，請稍後再試',
        color: 'red',
      })
    } finally {
      addLockRef.current = false
      setAddingCourseId(null)
    }
  }, [
    accountTimetableData,
    existingItems,
    guestTimetable,
    invalidateAccountTimetable,
    isAuthResolved,
    isAuthenticated,
    semester,
    updateAccountTimetableCache,
  ])

  useEffect(() => {
    if (!opened || !initialPlannerItem || !semester || !isAuthResolved) return
    if (!isAuthenticated && guestTimetable.error) return
    if (isAuthenticated && (
      isAccountTimetableLoading
      || hasAccountTimetableError
      || !accountTimetableData?.timetable.id
    )) return

    const contextKey = `${semester}:${initialPlannerItem.course.id}`
    if (autoAddContextRef.current === contextKey) return
    autoAddContextRef.current = contextKey

    if (existingItems.some((item) => item.course.id === initialPlannerItem.course.id)) {
      if (isAuthenticated) void invalidateAccountTimetable()
      return
    }
    void handleAddCourse(initialPlannerItem)
  }, [
    accountTimetableData,
    existingItems,
    guestTimetable.error,
    handleAddCourse,
    hasAccountTimetableError,
    initialPlannerItem,
    invalidateAccountTimetable,
    isAccountTimetableLoading,
    isAuthResolved,
    isAuthenticated,
    opened,
    semester,
  ])

  const requestRemoveCourse = (courseId: number): void => {
    const item = existingItems.find((currentItem) => currentItem.course.id === courseId)
    if (item) setRemoveTarget(item)
  }

  const handleGridCourseClick = (course: TimetableGridCell): void => {
    requestRemoveCourse(course.courseId)
  }

  const handleSearchCourseAction = (course: Course): void => {
    const courseIsAdded = existingItems.some((item) => item.course.id === course.id)
    if (courseIsAdded) {
      requestRemoveCourse(course.id)
      return
    }

    if (!Array.isArray(course.timeslots)) {
      notifications.show({
        title: '無法加入課程',
        message: '這筆搜尋結果缺少時段資料，請重新搜尋後再試。',
        color: 'red',
      })
      return
    }

    void handleAddCourse(buildPlannerItem(course, course.timeslots))
  }

  const handleConfirmRemoveCourse = async (): Promise<void> => {
    if (!removeTarget || !semester) return

    if (isAuthenticated) {
      const timetableId = accountTimetableData?.timetable.id
      if (!timetableId) return

      removeCourseMutation.mutate({
        timetableId,
        courseId: removeTarget.course.id,
        semester,
      }, {
        onSuccess: () => setRemoveTarget(null),
      })
      return
    }

    try {
      setIsGuestRemovePending(true)
      await guestTimetable.removeCourse(semester, removeTarget.course.id)
      notifications.show({
        title: '已移除課程',
        message: '課程已從本機課表移除',
        color: 'green',
      })
      setRemoveTarget(null)
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

  const handleConfirmSwap = async (): Promise<void> => {
    if (!pendingSwap) return

    setIsSwapSubmitting(true)
    try {
      if (pendingSwap.mode === 'guest') {
        const result = await guestTimetable.swapCourse(
          pendingSwap.item,
          pendingSwap.conflictCourseIds,
        )
        notifications.show({
          title: result.alreadyExists ? '課程已在課表中' : '已完成交換',
          message: result.alreadyExists
            ? '這門課已經在本機課表中，未調整原有課表。'
            : `已移除 ${result.removedCourseIds.length} 門衝堂課，並加入 ${pendingSwap.item.course.name}。此課表只保存在目前瀏覽器。`,
          color: result.alreadyExists ? 'blue' : 'green',
        })
      } else {
        const requestUserCacheScope = getUserCacheScope(useAuthStore.getState().user)
        const requestAuthSessionEpoch = captureAuthSessionEpoch()
        const result = await swapTimetableCourse(
          pendingSwap.timetableId,
          pendingSwap.item.course.id,
          pendingSwap.conflictCourseIds,
          { expectedSessionScope: requestUserCacheScope },
        )
        let guestCleanupFailed = false
        updateAccountTimetableCache(
          pendingSwap.timetableId,
          pendingSwap.item,
          result.removedCourseIds,
          requestUserCacheScope,
        )
        void invalidateAccountTimetable(requestUserCacheScope)

        if (guestTimetable.isCourseAdded(
          pendingSwap.item.course.semester,
          pendingSwap.item.course.id,
        )) {
          const isRequestSessionCurrent = () => isAuthenticatedUserCacheScopeCurrent(
            useAuthStore.getState(),
            requestUserCacheScope,
            requestAuthSessionEpoch,
          )
          if (!isRequestSessionCurrent()) {
            guestCleanupFailed = true
          } else {
            try {
              const removed = await guestTimetable.removeCourse(
                pendingSwap.item.course.semester,
                pendingSwap.item.course.id,
                isRequestSessionCurrent,
              )
              if (!removed && !isRequestSessionCurrent()) guestCleanupFailed = true
            } catch {
              guestCleanupFailed = true
            }
          }
        }
        notifications.show({
          title: result.alreadyExists ? '課程已在課表中' : '已完成交換',
          message: guestCleanupFailed
            ? '帳號課表已更新，但無法清除這門課的本機待處理資料。'
            : result.alreadyExists
              ? '這門課已經在課表中，未調整原有課表。'
              : `已移除 ${result.removedCourseIds.length} 門衝堂課，並加入 ${pendingSwap.item.course.name}`,
          color: guestCleanupFailed ? 'orange' : result.alreadyExists ? 'blue' : 'green',
        })
      }

      setFailedCourseId(null)
      setPendingSwap(null)
    } catch (error) {
      const conflictsChanged = (
        error instanceof GuestTimetableStorageError && error.code === 'CONFLICTS_CHANGED'
      ) || hasApiErrorCode(error, 'CONFLICTS_CHANGED')
      if (conflictsChanged) {
        setPendingSwap(null)
        if (pendingSwap.mode === 'account') void invalidateAccountTimetable()
      }
      setFailedCourseId(pendingSwap.item.course.id)
      notifications.show({
        title: '交換失敗',
        message: error instanceof Error ? error.message : '發生錯誤，請稍後再試',
        color: 'red',
      })
    } finally {
      setIsSwapSubmitting(false)
    }
  }

  const isMutationPending = addingCourseId !== null
    || isSwapSubmitting
    || isGuestRemovePending
    || removeCourseMutation.isPending
  const isAccountUnavailable = isAuthenticated
    && (isAccountTimetableLoading || hasAccountTimetableError)
  const closePlanner = (): void => {
    if (!isMutationPending) onClose()
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={closePlanner}
        title={`課表規劃${semester ? `｜${semester}` : ''}`}
        size='xl'
        fullScreen={isMobile}
        zIndex={1200}
        closeOnClickOutside={!isMutationPending}
        closeOnEscape={!isMutationPending}
        withCloseButton={!isMutationPending}
      >
        <div className={styles.plannerLayout}>
          <Stack ref={searchPaneRef} gap='sm' className={styles.plannerSearchPane}>
            <Tabs
              value={category}
              onChange={handleCategoryChange}
              className={[
                styles.plannerCategoryTabs,
                categoryTabOverflow.left ? styles.plannerCategoryTabsHasLeftOverflow : '',
                categoryTabOverflow.right ? styles.plannerCategoryTabsHasRightOverflow : '',
              ].filter(Boolean).join(' ')}
            >
              <Tabs.List
                ref={categoryTabsListRef}
                className={styles.plannerCategoryTabsList}
                onScroll={updateCategoryTabOverflow}
                onWheel={handleCategoryTabsWheel}
              >
                {plannerFilterOptions.map((option) => (
                  <Tabs.Tab key={option.value} value={option.value}>
                    {option.label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs>

            {selectedSlot && (
              <div className={styles.fixedFilterNotice} aria-live='polite'>
                <Badge size='sm' variant='filled' className={styles.fixedFilterBadge}>
                  固定時段
                </Badge>
                <div>
                  <Text size='sm' fw={700}>
                    星期{getWeekdayLabel(selectedSlot.dayOfWeek)}・第 {selectedSlot.period} 節
                  </Text>
                  <Text size='xs' c='dimmed'>以下結果都符合這個時段，可再依分類或關鍵字縮小範圍。</Text>
                </div>
              </div>
            )}

            {showOrganizationFilters && (
              <Group grow align='flex-start'>
                <Select
                  label='學院'
                  placeholder='全部'
                  data={academyList?.academies ?? []}
                  value={academy || null}
                  onChange={handleAcademyChange}
                  disabled={isLoadingAcademies}
                  searchable
                  clearable
                  nothingFoundMessage='找不到符合的學院'
                  comboboxProps={{ withinPortal: true, zIndex: 1300 }}
                />
                <Select
                  label='系所'
                  placeholder='全部'
                  data={departmentList?.departments ?? []}
                  value={department || null}
                  onChange={(value) => {
                    setDepartment(value ?? '')
                    setSearchPage(1)
                  }}
                  disabled={isLoadingDepartments}
                  searchable
                  clearable
                  nothingFoundMessage='找不到符合的系所'
                  comboboxProps={{ withinPortal: true, zIndex: 1300 }}
                />
              </Group>
            )}

            {showOrganizationFilters && (hasAcademiesError || hasDepartmentsError) && (
              <Text size='xs' c='red'>學院或系所選項載入失敗，請稍後重新開啟課表規劃。</Text>
            )}

            {category === 'university' && (
              <Select
                label='修別'
                placeholder='全部'
                data={courseTypeOptions}
                value={courseType || null}
                onChange={(value) => {
                  setCourseType(value ?? '')
                  setSearchPage(1)
                }}
                clearable
                comboboxProps={{ withinPortal: true, zIndex: 1300 }}
              />
            )}

            <form onSubmit={handleSearch}>
              <Group gap='xs' align='flex-end' wrap='nowrap'>
                <TextInput
                  label='搜尋課程或教師'
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.currentTarget.value)}
                  disabled={!semester}
                  className={styles.plannerSearchInput}
                />
                <Tooltip label='搜尋課程' withArrow>
                  <ActionIcon
                    type='submit'
                    size={36}
                    loading={isSearching}
                    disabled={!semester}
                    aria-label='搜尋課程'
                  >
                    <FaSearch size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </form>

            <Text size='xs' c='dimmed'>點擊加入後，右側課表會立即更新。</Text>

            <ScrollArea h={isMobile ? 300 : 520} type='auto'>
              <Stack gap='xs' pr='xs'>
                {hasSearchError && !isSearching && (
                  <Text size='sm' c='red'>課程搜尋失敗，請稍後再試。</Text>
                )}
                {isSearching && (
                  <Group justify='center' py='md'>
                    <Loader size='sm' />
                    <Text size='sm' c='dimmed'>載入搜尋結果...</Text>
                  </Group>
                )}
                {!hasSearchError && !isSearching && searchCourses.length === 0 && (
                  <Text size='sm' c='dimmed'>找不到符合條件的課程。</Text>
                )}
                {!hasSearchError && !isSearching && searchCourses.map((course) => {
                  const courseIsAdded = existingItems.some((item) => item.course.id === course.id)
                  const isThisCourseAdding = addingCourseId === course.id
                  return (
                    <Card key={course.id} withBorder padding='sm'>
                      <Stack gap={4}>
                        <Group justify='space-between' align='flex-start' wrap='nowrap'>
                          <Text fw={700} size='sm'>{course.course_name}</Text>
                        </Group>
                        <Text size='xs' c='dimmed'>
                          {[course.instructor, course.department].filter(Boolean).join('・')}
                        </Text>
                        <Text size='xs'>{course.course_time?.trim() || '未提供上課時段'}</Text>
                        <Group gap='xs' wrap='nowrap'>
                          <Button
                            size='xs'
                            variant={courseIsAdded ? 'light' : 'filled'}
                            color={courseIsAdded ? 'red' : undefined}
                            leftSection={courseIsAdded
                              ? <FaTrashAlt size={12} />
                              : <FaCalendarPlus size={12} />}
                            onClick={() => handleSearchCourseAction(course)}
                            loading={isThisCourseAdding}
                            disabled={
                              isMutationPending
                              || !isAuthResolved
                              || !Array.isArray(course.timeslots)
                              || Boolean(guestTimetable.error && !isAuthenticated)
                              || isAccountUnavailable
                            }
                            style={{ flex: 1 }}
                          >
                            {courseIsAdded ? `從 ${semester} 課表移除` : '加入課表'}
                          </Button>
                          <Tooltip label='另開新分頁查看課程評價' withArrow zIndex={1300}>
                            <ActionIcon
                              component={Link}
                              to={`/course/${course.id}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              size={30}
                              variant='subtle'
                              className={styles.courseExternalLinkButton}
                              aria-label={`另開新分頁查看「${course.course_name}」課程評價`}
                            >
                              <FaExternalLinkAlt size={13} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Stack>
                    </Card>
                  )
                })}
                {!hasSearchError && !isSearching && (courseSearchData?.pagination.totalPages ?? 0) > 1 && (
                  <Group justify='center' mt='xs'>
                    <Pagination
                      value={searchPage}
                      total={courseSearchData?.pagination.totalPages ?? 1}
                      onChange={setSearchPage}
                      size='sm'
                    />
                  </Group>
                )}
              </Stack>
            </ScrollArea>
          </Stack>

          <Stack gap='sm' className={styles.plannerPreviewPane}>
            <Group justify='space-between' align='flex-start' wrap='nowrap'>
              <div>
                <Text fw={800}>目前課表</Text>
                <Text size='sm' c='dimmed'>點擊課程格可查看評價或移除整門課；點擊空白格的＋可改用該時段篩選。</Text>
              </div>
              <Badge variant='light'>已排 {existingItems.length} 門</Badge>
            </Group>

            {guestTimetable.error && !isAuthenticated && (
              <Text size='sm' c='red'>{guestTimetable.error.message}</Text>
            )}
            {hasAccountTimetableError && isAuthenticated && (
              <Group gap='xs'>
                <Text size='sm' c='red'>帳號課表載入失敗，無法確認目前排課。</Text>
                <Button size='xs' variant='light' onClick={() => void refetchAccountTimetable()}>
                  重試
                </Button>
              </Group>
            )}
            {addingCourseId !== null && (
              <Group gap='xs'>
                <Loader size='xs' />
                <Text size='sm' c='dimmed'>正在加入課程，完成後會立即顯示在課表中。</Text>
              </Group>
            )}
            {initialPlannerItem
              && failedCourseId === initialPlannerItem.course.id
              && !existingItems.some((item) => item.course.id === initialPlannerItem.course.id)
              && (
                <div className={`${styles.alert} ${styles.alertRed}`}>
                  <Text fw={700} size='sm' className={styles.alertTitle}>這門課尚未加入</Text>
                  <Text size='sm' mb='xs'>剛才的操作失敗，可在此重新加入 {semester} 課表。</Text>
                  <Button
                    size='xs'
                    variant='light'
                    color='red'
                    onClick={() => void handleAddCourse(initialPlannerItem)}
                    disabled={isMutationPending || isAccountUnavailable}
                  >
                    重新加入
                  </Button>
                </div>
              )}

            <div className={styles.plannerPreviewScroll}>
              <Stack gap='sm' pr='xs'>
                {isAuthenticated && isAccountTimetableLoading ? (
                  <Group justify='center' py='xl'>
                    <Loader size='sm' />
                    <Text size='sm'>載入帳號課表...</Text>
                  </Group>
                ) : (
                  <TimetableGridTable
                    periodOrder={TIMETABLE_PERIOD_ORDER}
                    weekdaysToRender={weekdaysToRender}
                    grid={grid}
                    onCourseClick={handleGridCourseClick}
                    onEmptySlotClick={handleEmptySlotClick}
                    selectedSearchSlot={selectedSlot}
                    isCourseActionDisabled={isMutationPending}
                  />
                )}

                {offGridItems.length > 0 && (
                  <div className={`${styles.alert} ${styles.alertOrange}`}>
                    <Text fw={700} size='sm' className={styles.alertTitle}>未排入時間格</Text>
                    <Text size='xs' c='dimmed' mb='xs'>遠距或缺少時段的課程會列在這裡，也可直接移除。</Text>
                    <Stack gap='xs'>
                      {offGridItems.map((item) => (
                        <Group key={item.course.id} justify='space-between' wrap='nowrap'>
                          <div>
                            <Text size='sm' fw={600}>{item.course.name}</Text>
                            <Text size='xs' c='dimmed'>
                              {isEwantCourse(item.course) ? 'EWANT 遠距課程' : '缺少可用時段資料'}
                            </Text>
                          </div>
                          <Button
                            size='xs'
                            variant='subtle'
                            color='red'
                            leftSection={<FaTrashAlt size={12} />}
                            onClick={() => requestRemoveCourse(item.course.id)}
                            disabled={isMutationPending}
                          >
                            移除
                          </Button>
                        </Group>
                      ))}
                    </Stack>
                  </div>
                )}
              </Stack>
            </div>
          </Stack>
        </div>
      </Modal>

      <ConfirmModal
        opened={removeTarget !== null}
        onClose={() => {
          if (!isGuestRemovePending && !removeCourseMutation.isPending) {
            setRemoveTarget(null)
          }
        }}
        title='從課表移除課程？'
        message={`確定要從 ${semester ?? '目前學期'} 課表移除整門「${removeTarget?.course.name ?? ''}」嗎？`}
        confirmText='移除課程'
        cancelText='取消'
        loading={isGuestRemovePending || removeCourseMutation.isPending}
        onConfirm={handleConfirmRemoveCourse}
        zIndex={1400}
      />

      <SwapConflictModal
        opened={pendingSwap !== null}
        targetCourse={pendingSwap ? {
          id: pendingSwap.item.course.id,
          name: pendingSwap.item.course.name,
        } : null}
        conflictCourseIds={pendingSwap?.conflictCourseIds ?? []}
        addedCourseNameMap={addedCourseNameMap}
        isSubmitting={isSwapSubmitting}
        onClose={() => {
          if (!isSwapSubmitting) setPendingSwap(null)
        }}
        onConfirm={() => void handleConfirmSwap()}
      />
    </>
  )
}

export default TimetablePlannerModal
