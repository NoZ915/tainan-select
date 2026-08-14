import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ActionIcon,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Link, useLocation } from 'react-router-dom'
import { FaCalendarPlus, FaExternalLinkAlt } from 'react-icons/fa'

import {
  addTimetableCourse,
  getTimetableBySemester,
  swapTimetableCourse,
} from '../apis/timetableAPI'
import type { ApiError } from '../apis/axiosInstance'
import { useGuestTimetable } from '../hooks/timetables/useGuestTimetable'
import { QUERY_KEYS } from '../hooks/queryKeys'
import { useAuthStore } from '../stores/authStore'
import styles from '../styles/components/Timetable.module.css'
import {
  isGuestTimetableImportPromptHandled,
  markGuestTimetableImportPromptHandled,
  subscribeGuestTimetableImportPromptRequest,
} from '../utils/guestTimetableImportSession'
import { findConflictCourseIds } from '../utils/timetable'
import {
  captureAuthStatusRequestSnapshot,
  forceGuestAuthSessionRecord,
  getUserCacheScope,
  isAuthenticatedUserCacheScopeCurrent,
} from '../utils/userCacheScope'
import type {
  GuestTimetableItem,
  GuestTimetableStorage,
  TimetableConflict,
  TimetableResponse,
} from '../types/timetableType'
import SwapConflictModal from './TimetableSection/SwapConflictModal'

type ImportPhase = 'idle' | 'confirm-clear' | 'importing' | 'result'

type ImportSummary = {
  added: number
  alreadyExists: number
  conflicted: number
  failed: number
  skipped: number
}

type ImportConflictDetail = {
  timetableId: number
  semester: string
  courseId: number
  courseName: string
  item: GuestTimetableItem
  conflictingCourses: Array<{
    id: number
    name: string
  }>
}

type ImportContext = {
  userCacheScope: string
  authSessionEpoch: string
  authSessionSnapshot: ReturnType<typeof captureAuthStatusRequestSnapshot>
  controller: AbortController
}

const EMPTY_IMPORT_SUMMARY: ImportSummary = {
  added: 0,
  alreadyExists: 0,
  conflicted: 0,
  failed: 0,
  skipped: 0,
}

const getApiError = (error: unknown): ApiError | null =>
  error instanceof Error ? error as ApiError : null

const isUnauthorizedError = (error: unknown): boolean =>
  getApiError(error)?.status === 401

const hasApiErrorCode = (error: unknown, code: string): boolean => {
  const apiError = getApiError(error)
  if (!apiError) return false

  const errorData = apiError.data as { code?: unknown } | undefined
  return apiError.status === 409 && errorData?.code === code
}

const getConflictCourseIds = (error: unknown): number[] => {
  const apiError = getApiError(error)
  if (!apiError || apiError.status !== 409) return []

  const errorData = apiError.data as { conflicts?: TimetableConflict[] } | undefined
  if (!Array.isArray(errorData?.conflicts)) return []

  return Array.from(new Set(
    errorData.conflicts
      .map((conflict) => conflict.conflictWithCourseId)
      .filter((courseId) => Number.isSafeInteger(courseId) && courseId > 0),
  ))
}

const rebuildConflictDetail = (
  conflictDetail: ImportConflictDetail,
  timetableResponse: TimetableResponse,
  conflictCourseIds = findConflictCourseIds(
    conflictDetail.item,
    timetableResponse.items,
  ),
): ImportConflictDetail => {
  const courseNameMap = new Map(
    timetableResponse.items.map((item) => [item.course.id, item.course.name]),
  )

  return {
    ...conflictDetail,
    timetableId: timetableResponse.timetable.id,
    conflictingCourses: conflictCourseIds.map((courseId) => ({
      id: courseId,
      name: courseNameMap.get(courseId) ?? `課程 #${courseId}`,
    })),
  }
}

const AuthenticatedGuestTimetableImportModal: React.FC = () => {
  const queryClient = useQueryClient()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))
  const {
    storage,
    summary: guestSummary,
    error: guestStorageError,
    isCourseSnapshotCurrent,
    removeCourseSnapshot,
    clearAll,
  } = useGuestTimetable()
  const [phase, setPhase] = useState<ImportPhase>('idle')
  const [isHandled, setIsHandled] = useState(isGuestTimetableImportPromptHandled)
  const [importSummary, setImportSummary] = useState<ImportSummary>(EMPTY_IMPORT_SUMMARY)
  const [importConflictDetails, setImportConflictDetails] = useState<ImportConflictDetail[]>([])
  const [pendingSwap, setPendingSwap] = useState<ImportConflictDetail | null>(null)
  const [isSwapSubmitting, setIsSwapSubmitting] = useState(false)
  const [isClearSubmitting, setIsClearSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [clearAllSnapshot, setClearAllSnapshot] = useState<GuestTimetableStorage | null>(null)
  const importInProgressRef = useRef(false)
  const clearInProgressRef = useRef(false)
  const activeImportRef = useRef<ImportContext | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeGuestTimetableImportPromptRequest(() => {
      if (importInProgressRef.current || clearInProgressRef.current) return
      setActionError(null)
      setClearAllSnapshot(null)
      setPhase('idle')
      setIsHandled(false)
    })

    return () => {
      unsubscribe()
      activeImportRef.current?.controller.abort()
      activeImportRef.current = null
      importInProgressRef.current = false
      clearInProgressRef.current = false
    }
  }, [])

  const isImportContextCurrent = (importContext: ImportContext): boolean => {
    const authState = useAuthStore.getState()
    return activeImportRef.current === importContext
      && !importContext.controller.signal.aborted
      && isAuthenticatedUserCacheScopeCurrent(
        authState,
        importContext.userCacheScope,
        importContext.authSessionEpoch,
      )
  }

  const semesterEntries = useMemo(
    () => Object.entries(storage.semesters).filter(([, items]) => items.length > 0),
    [storage],
  )
  const shouldShowInitialPrompt = (
    guestSummary.totalCourses > 0 || guestStorageError !== null
  ) && !isHandled && location.pathname === '/timetable'
  const visiblePhase: ImportPhase = phase === 'idle' && shouldShowInitialPrompt ? 'idle' : phase
  const opened = shouldShowInitialPrompt || phase !== 'idle'

  const markHandled = (): void => {
    markGuestTimetableImportPromptHandled()
    setIsHandled(true)
  }

  const handleDismiss = (): void => {
    if (
      importInProgressRef.current
      || clearInProgressRef.current
      || phase === 'importing'
      || isSwapSubmitting
      || isClearSubmitting
      || pendingSwap !== null
    ) return
    markHandled()
    setActionError(null)
    setClearAllSnapshot(null)
    setPendingSwap(null)
    setPhase('idle')
  }

  const handleClearAll = async (): Promise<void> => {
    if (!clearAllSnapshot || clearInProgressRef.current) return

    try {
      clearInProgressRef.current = true
      setIsClearSubmitting(true)
      const clearResult = await clearAll(clearAllSnapshot)
      if (clearResult === 'changed') {
        setClearAllSnapshot(null)
        setPhase('idle')
        notifications.show({
          title: '本機課表已變更',
          message: '其他分頁已更新本機課表，請重新確認後再清除。',
          color: 'orange',
        })
        return
      }
      markHandled()
      setActionError(null)
      setClearAllSnapshot(null)
      setPhase('idle')
      notifications.show({
        title: clearResult === 'cleared' ? '已清除本機課表' : '本機課表已清空',
        message: clearResult === 'cleared'
          ? '所有訪客學期的本機課表皆已清除。'
          : '本機課表已在其他分頁清空。',
        color: clearResult === 'cleared' ? 'green' : 'blue',
      })
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '無法清除本機課表，請稍後再試。')
    } finally {
      clearInProgressRef.current = false
      setIsClearSubmitting(false)
    }
  }

  const handleImport = async (): Promise<void> => {
    if (importInProgressRef.current || clearInProgressRef.current) return
    importInProgressRef.current = true
    const authSessionSnapshot = captureAuthStatusRequestSnapshot()
    const importContext: ImportContext = {
      userCacheScope,
      authSessionEpoch: authSessionSnapshot?.epoch ?? '',
      authSessionSnapshot,
      controller: new AbortController(),
    }
    activeImportRef.current?.controller.abort()
    activeImportRef.current = importContext
    const requestContext = {
      signal: importContext.controller.signal,
      expectedSessionScope: importContext.userCacheScope,
    }

    const importEntries = semesterEntries.map(([semester, items]) => [semester, [...items]] as const)
    const totalCourses = importEntries.reduce((total, [, items]) => total + items.length, 0)
    const nextSummary: ImportSummary = { ...EMPTY_IMPORT_SUMMARY }
    const nextConflictDetails: ImportConflictDetail[] = []
    const cleanupErrors: string[] = []
    let authExpired = false
    let sessionChanged = false

    markHandled()
    setActionError(null)
    setImportSummary(EMPTY_IMPORT_SUMMARY)
    setImportConflictDetails([])
    setPhase('importing')

    for (const [semester, items] of importEntries) {
      if (!isImportContextCurrent(importContext)) {
        sessionChanged = true
        break
      }

      let timetableId: number
      let accountCourseNameMap = new Map<number, string>()

      try {
        const timetableResponse = await getTimetableBySemester(semester, requestContext)
        timetableId = timetableResponse.timetable.id
        accountCourseNameMap = new Map(
          timetableResponse.items.map((item) => [item.course.id, item.course.name]),
        )
      } catch (error) {
        if (importContext.controller.signal.aborted) return
        if (isUnauthorizedError(error)) {
          authExpired = true
          break
        }
        if (hasApiErrorCode(error, 'SESSION_CHANGED')) {
          sessionChanged = true
          break
        }

        nextSummary.failed += items.length
        continue
      }

      for (const item of items) {
        if (!isImportContextCurrent(importContext)) {
          sessionChanged = true
          break
        }

        try {
          if (!await isCourseSnapshotCurrent(item)) {
            nextSummary.skipped += 1
            continue
          }

          const result = await addTimetableCourse(
            timetableId,
            item.course.id,
            requestContext,
          )

          if (result.added) {
            nextSummary.added += 1
            accountCourseNameMap.set(item.course.id, item.course.name)
          } else if (result.alreadyExists) {
            nextSummary.alreadyExists += 1
            accountCourseNameMap.set(item.course.id, item.course.name)
          } else {
            nextSummary.failed += 1
            continue
          }

          if (!isImportContextCurrent(importContext)) {
            sessionChanged = true
            break
          }

          try {
            const removed = await removeCourseSnapshot(
              item,
              () => isImportContextCurrent(importContext),
            )
            if (!removed && !isImportContextCurrent(importContext)) {
              sessionChanged = true
              break
            }
            if (!removed) {
              cleanupErrors.push(
                `「${item.course.name}」的本機快照已由其他分頁變更，因此未移除其他資料。`,
              )
            }
          } catch (error) {
            cleanupErrors.push(
              error instanceof Error
                ? error.message
                : `「${item.course.name}」已保存到帳號，但無法清除本機資料。`,
            )
          }
        } catch (error) {
          if (importContext.controller.signal.aborted) return
          if (isUnauthorizedError(error)) {
            authExpired = true
            break
          }
          if (hasApiErrorCode(error, 'SESSION_CHANGED')) {
            sessionChanged = true
            break
          }

          const conflictCourseIds = getConflictCourseIds(error)
          if (conflictCourseIds.length > 0) {
            nextSummary.conflicted += 1
            nextConflictDetails.push({
              timetableId,
              semester,
              courseId: item.course.id,
              courseName: item.course.name,
              item,
              conflictingCourses: conflictCourseIds.map((courseId) => ({
                id: courseId,
                name: accountCourseNameMap.get(courseId) ?? `課程 #${courseId}`,
              })),
            })
          } else {
            nextSummary.failed += 1
          }
        }
      }

      if (authExpired || sessionChanged) break
    }

    if (authExpired || sessionChanged) {
      const categorizedCourses = nextSummary.added
        + nextSummary.alreadyExists
        + nextSummary.conflicted
        + nextSummary.failed
        + nextSummary.skipped
      nextSummary.failed += Math.max(totalCourses - categorizedCourses, 0)
    }

    if (!sessionChanged) {
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE] }),
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] }),
        ])
      } catch {
        cleanupErrors.push('帳號課表已處理，但畫面更新失敗，請重新整理後確認。')
      }
    }

    if (activeImportRef.current !== importContext) return
    activeImportRef.current = null
    importInProgressRef.current = false
    if (authExpired) {
      const changedToGuest = await forceGuestAuthSessionRecord(importContext.authSessionSnapshot)
      if (changedToGuest) logout()
      return
    }

    setImportSummary(nextSummary)
    setImportConflictDetails(nextConflictDetails)
    setActionError([
      ...cleanupErrors,
      ...(sessionChanged ? ['登入帳號已變更，匯入已停止；尚未處理的本機課程會繼續保留。'] : []),
    ].join(' ') || null)
    setPhase('result')
  }

  const pendingSwapCourseNameMap = useMemo(
    () => new Map(
      pendingSwap?.conflictingCourses.map((course) => [course.id, course.name]) ?? [],
    ),
    [pendingSwap],
  )

  const discardStaleConflictDetail = (conflictDetail: ImportConflictDetail): void => {
    setImportConflictDetails((currentDetails) => currentDetails.filter(
      (detail) => !(
        detail.semester === conflictDetail.semester
        && detail.courseId === conflictDetail.courseId
      ),
    ))
    setImportSummary((currentSummary) => ({
      ...currentSummary,
      conflicted: Math.max(currentSummary.conflicted - 1, 0),
      skipped: currentSummary.skipped + 1,
    }))
    setPendingSwap((currentPendingSwap) => (
      currentPendingSwap?.semester === conflictDetail.semester
        && currentPendingSwap.courseId === conflictDetail.courseId
        ? null
        : currentPendingSwap
    ))
    notifications.show({
      title: '本機課程已變更',
      message: `「${conflictDetail.courseName}」已由其他分頁移除或重新加入，本次不會處理。`,
      color: 'blue',
    })
  }

  const handleConflictCourseAction = async (
    conflictDetail: ImportConflictDetail,
  ): Promise<void> => {
    if (isSwapSubmitting) return

    setIsSwapSubmitting(true)
    setActionError(null)
    const requestUserCacheScope = userCacheScope
    const requestAuthSessionSnapshot = captureAuthStatusRequestSnapshot()
    const requestAuthSessionEpoch = requestAuthSessionSnapshot?.epoch ?? ''
    const requestContext = { expectedSessionScope: requestUserCacheScope }

    try {
      const timetableResponse = await getTimetableBySemester(
        conflictDetail.semester,
        requestContext,
      )

      if (!await isCourseSnapshotCurrent(conflictDetail.item)) {
        discardStaleConflictDetail(conflictDetail)
        return
      }

      try {
        const result = await addTimetableCourse(
          timetableResponse.timetable.id,
          conflictDetail.courseId,
          requestContext,
        )

        const isRequestSessionCurrent = () => isAuthenticatedUserCacheScopeCurrent(
          useAuthStore.getState(),
          requestUserCacheScope,
          requestAuthSessionEpoch,
        )
        if (!isRequestSessionCurrent()) {
          setActionError('登入帳號已變更；帳號課表可能已更新，本機待處理資料會繼續保留。')
          return
        }

        let localSnapshotChanged = false
        try {
          const removed = await removeCourseSnapshot(
            conflictDetail.item,
            isRequestSessionCurrent,
          )
          if (!removed && !isRequestSessionCurrent()) {
            setActionError('登入帳號已變更；帳號課表可能已更新，本機待處理資料會繼續保留。')
            return
          }
          if (!removed) {
            localSnapshotChanged = true
            setActionError('帳號課表已更新；本機快照已由其他分頁變更，因此未移除其他資料。')
          }
        } catch (error) {
          setActionError(
            error instanceof Error
              ? `課程已加入帳號課表，但本機資料清除失敗：${error.message}`
              : '課程已加入帳號課表，但本機資料清除失敗，請再試一次。',
          )
          return
        }

        setImportConflictDetails((currentDetails) => currentDetails.filter(
          (detail) => !(
            detail.semester === conflictDetail.semester
            && detail.courseId === conflictDetail.courseId
          ),
        ))
        setImportSummary((currentSummary) => ({
          ...currentSummary,
          added: currentSummary.added + (result.alreadyExists ? 0 : 1),
          alreadyExists: currentSummary.alreadyExists + (result.alreadyExists ? 1 : 0),
          conflicted: Math.max(currentSummary.conflicted - 1, 0),
        }))
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE] }),
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] }),
        ])
        notifications.show({
          title: result.alreadyExists ? '課程已在課表中' : '已加入課表',
          message: localSnapshotChanged
            ? `「${conflictDetail.courseName}」已完成帳號處理，其他分頁的本機資料未受影響。`
            : `「${conflictDetail.courseName}」已完成處理，本機待處理資料已清除。`,
          color: result.alreadyExists ? 'blue' : 'green',
        })
      } catch (error) {
        const latestConflictCourseIds = getConflictCourseIds(error)
        if (latestConflictCourseIds.length > 0) {
          const latestTimetableResponse = await getTimetableBySemester(
            conflictDetail.semester,
            requestContext,
          )
          const refreshedDetail = rebuildConflictDetail(
            conflictDetail,
            latestTimetableResponse,
            latestConflictCourseIds,
          )
          setImportConflictDetails((currentDetails) => currentDetails.map((detail) => (
            detail.semester === conflictDetail.semester
              && detail.courseId === conflictDetail.courseId
              ? refreshedDetail
              : detail
          )))
          setPendingSwap(refreshedDetail)
          return
        }
        throw error
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const changedToGuest = await forceGuestAuthSessionRecord(requestAuthSessionSnapshot)
        if (changedToGuest) logout()
        return
      }
      if (hasApiErrorCode(error, 'SESSION_CHANGED')) {
        setActionError('登入帳號已變更，請重新開啟本機課表匯入流程。')
        return
      }

      setActionError(error instanceof Error ? error.message : '無法處理這門課，請稍後再試。')
    } finally {
      setIsSwapSubmitting(false)
    }
  }

  const handleConfirmSwap = async (): Promise<void> => {
    if (!pendingSwap || isSwapSubmitting) return

    setIsSwapSubmitting(true)
    setActionError(null)
    const requestUserCacheScope = userCacheScope
    const requestAuthSessionSnapshot = captureAuthStatusRequestSnapshot()
    const requestAuthSessionEpoch = requestAuthSessionSnapshot?.epoch ?? ''
    try {
      if (!await isCourseSnapshotCurrent(pendingSwap.item)) {
        discardStaleConflictDetail(pendingSwap)
        return
      }

      const result = await swapTimetableCourse(
        pendingSwap.timetableId,
        pendingSwap.courseId,
        pendingSwap.conflictingCourses.map((course) => course.id),
        { expectedSessionScope: requestUserCacheScope },
      )

      let timetableRefreshFailed = false
      let refreshedTimetable: TimetableResponse | null = null
      let localSnapshotChanged = false
      try {
        refreshedTimetable = await getTimetableBySemester(
          pendingSwap.semester,
          { expectedSessionScope: requestUserCacheScope },
        )
      } catch (error) {
        if (isUnauthorizedError(error) || hasApiErrorCode(error, 'SESSION_CHANGED')) {
          throw error
        }
        timetableRefreshFailed = true
      }

      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE] }),
          queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TIMETABLE_ALL_ITEMS] }),
        ])
      } catch {
        timetableRefreshFailed = true
      }

      const isRequestSessionCurrent = () => isAuthenticatedUserCacheScopeCurrent(
        useAuthStore.getState(),
        requestUserCacheScope,
        requestAuthSessionEpoch,
      )
      if (!isRequestSessionCurrent()) {
        setPendingSwap(null)
        setActionError('登入帳號已變更；帳號課表可能已完成交換，本機待處理資料會繼續保留。')
        return
      }

      try {
        const removed = await removeCourseSnapshot(
          pendingSwap.item,
          isRequestSessionCurrent,
        )
        if (!removed && !isRequestSessionCurrent()) {
          setPendingSwap(null)
          setActionError('登入帳號已變更；帳號課表可能已完成交換，本機待處理資料會繼續保留。')
          return
        }
        if (!removed) {
          localSnapshotChanged = true
        }
      } catch (error) {
        setActionError(
          error instanceof Error
            ? `帳號課表已完成交換，但本機資料清除失敗：${error.message}`
            : '帳號課表已完成交換，但本機資料清除失敗，請再試一次。',
        )
        notifications.show({
          title: '課表已交換',
          message: '帳號課表已更新，但本機資料尚未清除。',
          color: 'orange',
        })
        setPendingSwap(null)
        return
      }

      setImportConflictDetails((currentDetails) => currentDetails
        .filter((detail) => !(
          detail.semester === pendingSwap.semester
          && detail.courseId === pendingSwap.courseId
        ))
        .map((detail) => (
          refreshedTimetable && detail.semester === pendingSwap.semester
            ? rebuildConflictDetail(detail, refreshedTimetable)
            : detail
        )))
      setImportSummary((currentSummary) => ({
        ...currentSummary,
        added: currentSummary.added + (result.alreadyExists ? 0 : 1),
        alreadyExists: currentSummary.alreadyExists + (result.alreadyExists ? 1 : 0),
        conflicted: Math.max(currentSummary.conflicted - 1, 0),
      }))
      setActionError([
        ...(localSnapshotChanged
          ? ['帳號課表已完成交換；本機快照已由其他分頁變更，因此未移除其他資料。']
          : []),
        ...(timetableRefreshFailed
          ? ['課表畫面更新失敗，請重新整理後確認。']
          : []),
      ].join(' ') || null)
      notifications.show({
        title: result.alreadyExists ? '課程已在課表中' : '已完成交換',
        message: localSnapshotChanged
          ? `「${pendingSwap.courseName}」已完成帳號處理，其他分頁的本機資料未受影響。`
          : result.alreadyExists
            ? `「${pendingSwap.courseName}」已在帳號課表中，本機待處理資料已清除。`
            : `已移除 ${result.removedCourseIds.length} 門衝堂課，並加入「${pendingSwap.courseName}」。`,
        color: result.alreadyExists ? 'blue' : 'green',
      })
      setPendingSwap(null)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        const changedToGuest = await forceGuestAuthSessionRecord(requestAuthSessionSnapshot)
        if (changedToGuest) logout()
        return
      }
      if (hasApiErrorCode(error, 'SESSION_CHANGED')) {
        setPendingSwap(null)
        setActionError('登入帳號已變更，請重新開啟本機課表匯入流程。')
        return
      }
      if (hasApiErrorCode(error, 'CONFLICTS_CHANGED') && pendingSwap) {
        try {
          const timetableResponse = await getTimetableBySemester(
            pendingSwap.semester,
            { expectedSessionScope: requestUserCacheScope },
          )
          const refreshedDetail = rebuildConflictDetail(
            pendingSwap,
            timetableResponse,
            getConflictCourseIds(error),
          )
          setImportConflictDetails((currentDetails) => currentDetails.map((detail) => (
            detail.semester === pendingSwap.semester
              && detail.courseId === pendingSwap.courseId
              ? refreshedDetail
              : detail
          )))
          setPendingSwap(refreshedDetail.conflictingCourses.length > 0 ? refreshedDetail : null)
          setActionError('帳號課表已變更，衝堂明細已更新，請重新確認。')
          return
        } catch (refreshError) {
          setPendingSwap(null)
          setActionError(
            refreshError instanceof Error
              ? refreshError.message
              : '課表已變更，但無法更新衝堂明細，請稍後再試。',
          )
          return
        }
      }

      setActionError(error instanceof Error ? error.message : '交換課程失敗，請稍後再試。')
    } finally {
      setIsSwapSubmitting(false)
    }
  }

  const modalTitle = visiblePhase === 'confirm-clear'
    ? '確認清除本機課表'
    : visiblePhase === 'result'
      ? '本機課表匯入結果'
      : '保存本機課表'

  return (
    <>
      <Modal
        opened={opened}
        onClose={handleDismiss}
        title={modalTitle}
        centered
        zIndex={1400}
        scrollAreaComponent={ScrollArea.Autosize}
        closeOnClickOutside={phase !== 'importing' && !isSwapSubmitting && !isClearSubmitting && pendingSwap === null}
        closeOnEscape={phase !== 'importing' && !isSwapSubmitting && !isClearSubmitting && pendingSwap === null}
        withCloseButton={phase !== 'importing' && !isSwapSubmitting && !isClearSubmitting && pendingSwap === null}
      >
      {visiblePhase === 'idle' && (
        <Stack gap='md'>
          {guestStorageError ? (
            <Text c='red'>{guestStorageError.message}</Text>
          ) : (
            <>
              <Text>
                偵測到本機課表，共 {guestSummary.totalCourses} 門課、涵蓋 {guestSummary.semesterCount} 個學期。
              </Text>
              <Text size='sm' c='dimmed'>
                你可以保存到帳號以跨裝置同步，系統不會覆蓋或自動移除帳號內既有課程。
              </Text>
            </>
          )}
          <Group justify='flex-end'>
            <Button variant='subtle' onClick={handleDismiss}>稍後處理</Button>
            <Button
              variant='light'
              color='red'
              disabled={guestStorageError !== null}
              onClick={() => {
                setActionError(null)
                setClearAllSnapshot(storage)
                setPhase('confirm-clear')
              }}
            >
              清除本機課表
            </Button>
            <Button
              disabled={guestStorageError !== null}
              onClick={() => void handleImport()}
            >
              保存到帳號
            </Button>
          </Group>
        </Stack>
      )}

      {visiblePhase === 'confirm-clear' && (
        <Stack gap='md'>
          <Text>確定要清除所有訪客學期的本機課表嗎？此動作不會影響帳號課表，但無法復原。</Text>
          {actionError && <Text size='sm' c='red'>{actionError}</Text>}
          <Group justify='flex-end'>
            <Button
              variant='light'
              onClick={() => {
                setActionError(null)
                setClearAllSnapshot(null)
                setPhase('idle')
              }}
              disabled={isClearSubmitting}
            >
              取消
            </Button>
            <Button
              color='red'
              loading={isClearSubmitting}
              onClick={() => void handleClearAll()}
            >
              確認清除
            </Button>
          </Group>
        </Stack>
      )}

      {visiblePhase === 'importing' && (
        <Group justify='center' py='lg'>
          <Loader size='sm' />
          <Text>正在保存本機課表，請稍候...</Text>
        </Group>
      )}

      {visiblePhase === 'result' && (
        <Stack gap='sm'>
          <Text>成功加入：{importSummary.added}</Text>
          <Text>已存在：{importSummary.alreadyExists}</Text>
          <Text>發生衝堂：{importSummary.conflicted}</Text>
          <Text>匯入失敗：{importSummary.failed}</Text>
          <Text>本機快照已變更：{importSummary.skipped}</Text>
          {importConflictDetails.length > 0 && (
            <Stack gap='xs' mt='xs'>
              <div>
                <Text fw={700}>衝堂明細</Text>
                <Text size='xs' c='dimmed'>這些課程仍保留在本機，可直接選擇是否替換帳號內的衝堂課程。</Text>
              </div>
              {importConflictDetails.map((conflictDetail) => (
                <Card
                  key={`${conflictDetail.semester}-${conflictDetail.courseId}`}
                  withBorder
                  padding='sm'
                >
                  <Stack gap={6}>
                    <Text size='sm' fw={700}>
                      {conflictDetail.semester}｜{conflictDetail.courseName}
                    </Text>
                    <Text size='xs' c='dimmed'>
                      {conflictDetail.conflictingCourses.length > 0
                        ? `與 ${conflictDetail.conflictingCourses.map((course) => course.name).join('、')} 衝堂`
                        : '目前已無衝堂，可直接加入帳號課表'}
                    </Text>
                    <Group gap='xs' wrap='nowrap'>
                      <Button
                        size='xs'
                        variant='light'
                        leftSection={<FaCalendarPlus size={12} />}
                        disabled={isSwapSubmitting}
                        onClick={() => void handleConflictCourseAction(conflictDetail)}
                        style={{ flex: 1 }}
                      >
                        加入課表
                      </Button>
                      <Tooltip label='另開新分頁查看課程評價' withArrow zIndex={1600}>
                        <ActionIcon
                          component={Link}
                          to={`/course/${conflictDetail.courseId}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          size={30}
                          variant='subtle'
                          className={styles.courseExternalLinkButton}
                          aria-label={`另開新分頁查看「${conflictDetail.courseName}」課程評價`}
                        >
                          <FaExternalLinkAlt size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
          {actionError && <Text size='sm' c='red'>{actionError}</Text>}
          <Group justify='flex-end' mt='sm'>
            <Button onClick={handleDismiss}>完成</Button>
          </Group>
        </Stack>
      )}
      </Modal>

      <SwapConflictModal
        opened={pendingSwap !== null}
        targetCourse={pendingSwap ? {
          id: pendingSwap.courseId,
          name: pendingSwap.courseName,
        } : null}
        conflictCourseIds={pendingSwap?.conflictingCourses.map((course) => course.id) ?? []}
        addedCourseNameMap={pendingSwapCourseNameMap}
        isSubmitting={isSwapSubmitting}
        zIndex={1500}
        showCourseLinks={false}
        onClose={() => {
          if (!isSwapSubmitting) setPendingSwap(null)
        }}
        onConfirm={() => void handleConfirmSwap()}
      />
    </>
  )
}

const GuestTimetableImportModal: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isAuthResolved = useAuthStore((state) => state.isAuthResolved)
  const userCacheScope = useAuthStore((state) => getUserCacheScope(state.user))

  if (!isAuthResolved || !isAuthenticated) return null

  return <AuthenticatedGuestTimetableImportModal key={userCacheScope} />
}

export default GuestTimetableImportModal
