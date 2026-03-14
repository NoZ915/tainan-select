import { useMemo, useState } from 'react'
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Modal,
  NumberInput,
  Pagination,
  ScrollArea,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FiCopy, FiExternalLink, FiLink2, FiTrash2 } from 'react-icons/fi'
import { useAttachRelatedPostToCourses } from '../hooks/admin/useAttachRelatedPostToCourses'
import { useGetRelatedPostOverview } from '../hooks/admin/useGetRelatedPostOverview'
import { useImportDcardSource } from '../hooks/admin/useImportDcardSource'
import { useDeleteRelatedPost } from '../hooks/admin/useDeleteRelatedPost'
import { useDeleteRelatedPostImport } from '../hooks/admin/useDeleteRelatedPostImport'
import { usePreviewImportDcardSource } from '../hooks/admin/usePreviewImportDcardSource'
import { useSyncRelatedPostsFromGoogle } from '../hooks/admin/useSyncRelatedPostsFromGoogle'
import { useGetCourses } from '../hooks/courses/useGetCourses'
import { ManualImportPayloadItem, ManualImportPreviewResponse } from '../types/adminType'
import styles from '../styles/pages/AdminRelatedPostsPage.module.css'
import ConfirmModal from '../components/ConfirmModal'

const dcardExportSnippet = `(() => {
  const meta = (selector) => document.querySelector(selector)?.content?.trim() || null
  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href
  const nextData = JSON.parse(document.querySelector('#__NEXT_DATA__')?.textContent || '{}')
  const postId = nextData?.query?.postId
  const post = postId ? nextData?.props?.initialState?.post?.data?.[postId] : null
  const socialPosting = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((node) => {
      try { return JSON.parse(node.textContent || '{}') } catch { return null }
    })
    .flatMap((item) => Array.isArray(item) ? item : [item])
    .find((item) => item?.['@type'] === 'SocialMediaPosting')

  const payload = {
    title: post?.title || meta('meta[property="og:title"]') || document.title,
    post_url: canonical,
    forum_alias: nextData?.query?.forumAlias || canonical.match(/\\/f\\/([^/]+)\\//)?.[1] || 'nutn',
    created_at_source: post?.createdAt || socialPosting?.datePublished || null,
    excerpt: post?.excerpt || meta('meta[property="og:description"]') || null,
    preview_title: meta('meta[property="og:title"]') || post?.title || null,
    preview_description: meta('meta[property="og:description"]') || post?.excerpt || null,
    preview_image_url: meta('meta[property="og:image"]') || null,
    preview_site_name: meta('meta[property="og:site_name"]') || 'Dcard',
    content: post?.content || socialPosting?.text || null,
    comments_json: Array.isArray(socialPosting?.comment)
      ? socialPosting.comment.map((comment) => ({
          author: comment?.author?.name || null,
          text: comment?.text || '',
          created_at: comment?.datePublished || null,
          url: comment?.url || null,
          like_count: comment?.interactionStatistic?.userInteractionCount ?? null,
        })).filter((comment) => comment.text)
      : [],
  }

  const json = JSON.stringify(payload, null, 2)
  console.log(json)
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json).then(() => console.log('Dcard 匯出資料已複製到剪貼簿'))
  }
  return json
})()`


const AdminRelatedPostsPage: React.FC = () => {
  const [recentPostsPage, setRecentPostsPage] = useState(1)
  const [recentImportsPage, setRecentImportsPage] = useState(1)
  const { data: overview, isLoading } = useGetRelatedPostOverview({
    recentPostsPage,
    recentImportsPage,
  })
  const dcardSourceMutation = useImportDcardSource()
  const deleteRelatedPostMutation = useDeleteRelatedPost()
  const deleteRelatedPostImportMutation = useDeleteRelatedPostImport()
  const previewDcardSourceMutation = usePreviewImportDcardSource()
  const googleSyncMutation = useSyncRelatedPostsFromGoogle()
  const attachRelatedPostMutation = useAttachRelatedPostToCourses()

  const [dcardSourceInput, setDcardSourceInput] = useState('')
  const [previewModalOpened, setPreviewModalOpened] = useState(false)
  const [importPreviewResult, setImportPreviewResult] = useState<ManualImportPreviewResponse | null>(null)
  const [selectedPreviewCourseIds, setSelectedPreviewCourseIds] = useState<Record<number, number[]>>({})
  const [previewCourseKeywordOverrides, setPreviewCourseKeywordOverrides] = useState<Record<number, string>>({})
  const [previewCourseLookupKeyword, setPreviewCourseLookupKeyword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
    course_name?: string;
    instructor?: string;
    semester?: string;
  } | null>(null)
  const [deleteImportTarget, setDeleteImportTarget] = useState<{
    id: number;
    source_type: string;
    created_by_name?: string | null;
    created_at: Date;
  } | null>(null)
  const [attachTarget, setAttachTarget] = useState<{
    id: number;
    post_id: number;
    title: string;
    post_url: string;
    course_name?: string;
    instructor?: string;
    semester?: string;
  } | null>(null)
  const [googleLimit, setGoogleLimit] = useState<number>(30)
  const [googleMaxResults, setGoogleMaxResults] = useState<number>(5)
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(true)
  const [replaceGoogle, setReplaceGoogle] = useState(false)
  const [semester, setSemester] = useState('')
  const [attachCourseLookupKeyword, setAttachCourseLookupKeyword] = useState('')
  const [selectedAttachCourseIds, setSelectedAttachCourseIds] = useState<number[]>([])
  const [attachCourseKeywordOverrides, setAttachCourseKeywordOverrides] = useState<Record<number, string>>({})

  const previewCourseLookupSearchParams = useMemo(() => ({
    page: 1,
    limit: 8,
    search: previewCourseLookupKeyword.trim(),
    category: 'all',
    academy: '',
    department: '',
    courseType: '',
    weekdays: [],
    periods: [],
    semesters: [],
    sortBy: 'viewDesc',
  }), [previewCourseLookupKeyword])

  const {
    data: previewCourseLookupResult,
    isLoading: isPreviewCourseLookupLoading,
  } = useGetCourses(previewCourseLookupSearchParams, previewCourseLookupKeyword.trim().length >= 2)

  const attachCourseLookupSearchParams = useMemo(() => ({
    page: 1,
    limit: 8,
    search: attachCourseLookupKeyword.trim(),
    category: 'all',
    academy: '',
    department: '',
    courseType: '',
    weekdays: [],
    periods: [],
    semesters: [],
    sortBy: 'viewDesc',
  }), [attachCourseLookupKeyword])

  const {
    data: attachCourseLookupResult,
    isLoading: isAttachCourseLookupLoading,
  } = useGetCourses(attachCourseLookupSearchParams, attachCourseLookupKeyword.trim().length >= 2)

  const countsMap = useMemo(
    () => new Map((overview?.counts ?? []).map((item) => [item.source, item.count])),
    [overview?.counts]
  )

  const handleOpenAttachModal = (post: {
    id: number;
    post_id: number;
    title: string;
    post_url: string;
    course_name?: string;
    instructor?: string;
    semester?: string;
  }) => {
    setAttachTarget(post)
    setAttachCourseLookupKeyword('')
    setSelectedAttachCourseIds([])
    setAttachCourseKeywordOverrides({})
  }

  const handleToggleAttachCourse = (courseId: number, checked: boolean) => {
    setSelectedAttachCourseIds((current) => {
      const next = new Set(current)
      if (checked) {
        next.add(courseId)
      } else {
        next.delete(courseId)
      }

      return [...next]
    })
  }

  const handleAttachCourseKeywordChange = (courseId: number, value: string) => {
    setAttachCourseKeywordOverrides((current) => ({
      ...current,
      [courseId]: value,
    }))
  }

  const handleTogglePreviewCourse = (itemIndex: number, courseId: number, checked: boolean) => {
    setSelectedPreviewCourseIds((current) => {
      const nextIds = new Set(current[itemIndex] ?? [])
      if (checked) {
        nextIds.add(courseId)
      } else {
        nextIds.delete(courseId)
      }

      return {
        ...current,
        [itemIndex]: [...nextIds],
      }
    })
  }

  const handlePreviewCourseKeywordChange = (courseId: number, value: string) => {
    setPreviewCourseKeywordOverrides((current) => ({
      ...current,
      [courseId]: value,
    }))
  }

  const getPreviewCourseKeywordPreview = (courseId: number, fallbackKeywords: string[]) => {
    const overrideKeywords = (previewCourseKeywordOverrides[courseId] ?? '')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0)

    return overrideKeywords.length > 0 ? overrideKeywords : fallbackKeywords
  }

  const handleConfirmImport = async () => {
    if (!importPreviewResult) return

    const finalItems = importPreviewResult.items.reduce<ManualImportPayloadItem[]>((acc, item) => {
      if (item.error) return acc

      const selectedIds = selectedPreviewCourseIds[item.index] ?? []
      if (selectedIds.length === 0) return acc

      acc.push({
        ...item.import_item,
        course_ids: selectedIds,
        course_keyword_overrides: selectedIds.reduce<Array<{ course_id: number; manual_keywords?: string[] }>>(
          (overrides, courseId) => {
            const manualKeywords = (previewCourseKeywordOverrides[courseId] ?? '')
              .split(',')
              .map((keyword) => keyword.trim())
              .filter((keyword) => keyword.length > 0)

            if (manualKeywords.length > 0) {
              overrides.push({
                course_id: courseId,
                manual_keywords: manualKeywords,
              })
            }

            return overrides
          },
          []
        ),
      })

      return acc
    }, [])

    if (finalItems.length === 0) {
      notifications.show({
        title: '沒有可匯入的課程',
        message: '請至少勾選一門課程，再進行匯入。',
        color: 'red',
      })
      return
    }

    try {
      const result = await dcardSourceMutation.mutateAsync({
        input: JSON.stringify(finalItems, null, 2),
        rawInput: dcardSourceInput,
        replaceExisting: false,
      })

      setPreviewModalOpened(false)
      setPreviewCourseLookupKeyword('')
      setPreviewCourseKeywordOverrides({})
      notifications.show({
        title: '匯入完成',
        message: `已匯入 ${result.importedRows} 筆，配對 ${result.matchedCourses} 門課，另有 ${result.unmatchedItems} 筆未寫入。`,
        color: 'green',
      })
      return
    } catch (error) {
      notifications.show({
        title: '匯入失敗',
        message: error instanceof Error ? error.message : '匯入失敗',
        color: 'red',
      })
      return
    }
  }

  const handleOpenDcardSourcePreview = async () => {
    try {
      const result = await previewDcardSourceMutation.mutateAsync({
        input: dcardSourceInput,
      })
      setImportPreviewResult(result)
      setSelectedPreviewCourseIds(
        result.items.reduce<Record<number, number[]>>((acc, item) => {
          acc[item.index] = item.matches.map((match) => match.course_id)
          return acc
        }, {})
      )
      setPreviewCourseLookupKeyword('')
      setPreviewModalOpened(true)
    } catch (error) {
      notifications.show({
        title: 'Dcard 預覽失敗',
        message: error instanceof Error ? error.message : '請確認輸入內容格式是否正確',
        color: 'red',
      })
      return
    }
  }


  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(dcardExportSnippet)
      notifications.show({
        title: '已複製',
        message: 'Dcard 匯出腳本已複製到剪貼簿',
        color: 'green',
      })
    } catch {
      notifications.show({
        title: '複製失敗',
        message: '請手動複製下方腳本',
        color: 'red',
      })
    }
  }

  const handleGoogleSync = async () => {
    try {
      const result = await googleSyncMutation.mutateAsync({
        limit: googleLimit,
        maxResultsPerCourse: googleMaxResults,
        onlyUnreviewed,
        semester: semester.trim() || undefined,
        replaceExisting: replaceGoogle,
      })

      notifications.show({
        title: 'Google 同步完成',
        message: `搜尋 ${result.searchedCourses} 門課，命中 ${result.matchedCourses} 門，寫入 ${result.insertedRows} 筆。`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Google 同步失敗',
        message: error instanceof Error ? error.message : '執行失敗',
        color: 'red',
      })
    }
  }

  const handleAttachRelatedPost = async () => {
    if (!attachTarget) return

    if (selectedAttachCourseIds.length === 0) {
      notifications.show({
        title: 'No courses selected',
        message: 'Select at least one course to attach.',
        color: 'red',
      })
      return
    }

    try {
      const result = await attachRelatedPostMutation.mutateAsync({
        id: attachTarget.id,
        course_ids: selectedAttachCourseIds,
        course_keyword_overrides: selectedAttachCourseIds.reduce<
          Array<{ course_id: number; manual_keywords?: string[] }>
        >((overrides, courseId) => {
          const manualKeywords = (attachCourseKeywordOverrides[courseId] ?? '')
            .split(',')
            .map((keyword) => keyword.trim())
            .filter((keyword) => keyword.length > 0)

          overrides.push({
            course_id: courseId,
            manual_keywords: manualKeywords,
          })

          return overrides
        }, []),
      })

      notifications.show({
        title: 'Courses attached',
        message: `Attached ${result.attachedCourses} course(s), skipped ${result.skippedCourses}.`,
        color: 'green',
      })

      setAttachTarget(null)
      setAttachCourseLookupKeyword('')
      setSelectedAttachCourseIds([])
      setAttachCourseKeywordOverrides({})
    } catch (error) {
      notifications.show({
        title: 'Attach failed',
        message: error instanceof Error ? error.message : 'Failed to attach courses.',
        color: 'red',
      })
    }
  }

  const handleDeleteRelatedPost = async (id: number) => {
    try {
      await deleteRelatedPostMutation.mutateAsync(id)
      notifications.show({
        title: '已刪除',
        message: `相關貼文 ${id} 已刪除`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '刪除失敗',
        color: 'red',
      })
    }
  }

  const handleDeleteRelatedPostImport = async (id: number) => {
    try {
      await deleteRelatedPostImportMutation.mutateAsync(id)
      notifications.show({
        title: '已刪除',
        message: `匯入紀錄 ${id} 已刪除`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: '刪除失敗',
        message: error instanceof Error ? error.message : '刪除失敗',
        color: 'red',
      })
    }
  }

  return (
    <Container size='lg' className={styles.container}>
      <ConfirmModal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title='確認刪除相關貼文'
        message={
          deleteTarget
            ? `確定要刪除「${deleteTarget.title}」嗎？課程：${deleteTarget.course_name ?? '-'}，老師：${deleteTarget.instructor ?? '-'}，學期：${deleteTarget.semester ?? '-'}`
            : '確定要刪除此筆相關貼文嗎？'
        }
        confirmText='刪除'
        cancelText='取消'
        loading={deleteRelatedPostMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return
          void handleDeleteRelatedPost(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />

      <ConfirmModal
        opened={deleteImportTarget !== null}
        onClose={() => setDeleteImportTarget(null)}
        title='確認刪除匯入紀錄'
        message={
          deleteImportTarget
            ? `確定要刪除這筆匯入紀錄嗎？類型：${deleteImportTarget.source_type}，建立者：${deleteImportTarget.created_by_name ?? '-'}，建立時間：${new Date(deleteImportTarget.created_at).toLocaleString()}`
            : '確定要刪除此筆匯入紀錄嗎？'
        }
        confirmText='刪除'
        cancelText='取消'
        loading={deleteRelatedPostImportMutation.isPending}
        onConfirm={() => {
          if (!deleteImportTarget) return
          void handleDeleteRelatedPostImport(deleteImportTarget.id)
          setDeleteImportTarget(null)
        }}
      />

      <Modal
        opened={previewModalOpened}
        onClose={() => {
          setPreviewModalOpened(false)
          setPreviewCourseLookupKeyword('')
          setPreviewCourseKeywordOverrides({})
        }}
        title='匯入前確認課程'
        size='xl'
        zIndex={1100}
      >
        <Stack>
          <Text size='sm' c='dimmed'>
            勾選這次要綁定的課程。只有勾選的課程會真的寫入 DB。
          </Text>
          <Card withBorder>
            <Stack gap='xs'>
              <TextInput
                label='搜尋更多課程'
                placeholder='課名 / 老師 / 學期'
                value={previewCourseLookupKeyword}
                onChange={(event) => setPreviewCourseLookupKeyword(event.currentTarget.value)}
              />
              {previewCourseLookupKeyword.trim().length < 2 ? (
                <Text size='sm' c='dimmed'>至少輸入 2 個字才能搜尋課程。</Text>
              ) : isPreviewCourseLookupLoading ? (
                <Group justify='center'><Loader size='sm' /></Group>
              ) : (previewCourseLookupResult?.courses ?? []).length === 0 ? (
                <Text size='sm' c='dimmed'>找不到符合的課程。</Text>
              ) : (
                <Stack gap='xs'>
                  {(previewCourseLookupResult?.courses ?? []).map((course) => (
                    <Card key={`preview-search-${course.id}`} withBorder>
                      <Stack gap={6}>
                        {(importPreviewResult?.items ?? []).map((item) => (
                          <Checkbox
                            key={`preview-search-${item.index}-${course.id}`}
                            checked={(selectedPreviewCourseIds[item.index] ?? []).includes(course.id)}
                            onChange={(event) =>
                              handleTogglePreviewCourse(item.index, course.id, event.currentTarget.checked)
                            }
                            label={`第 ${item.index + 1} 筆：${course.course_name} / ${course.instructor} (ID: ${course.id}, score: 1)`}
                            description={`${course.department || '未分類系所'} / ${getPreviewCourseKeywordPreview(course.id, []).join(', ') || '未設定匹配關鍵字'}`}
                          />
                        ))}
                        <TextInput
                          size='sm'
                          label='匹配關鍵字'
                          placeholder='可選填，使用逗號分隔，例如：教育心理學, 王老師'
                          value={previewCourseKeywordOverrides[course.id] ?? ''}
                          onChange={(event) =>
                            handlePreviewCourseKeywordChange(course.id, event.currentTarget.value)
                          }
                        />
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Stack>
          </Card>
          <ScrollArea.Autosize mah={520}>
            <Stack gap='md'>
              {(importPreviewResult?.items ?? []).map((item) => (
                <Card key={`${item.index}-${item.import_item.post_url}`} withBorder className={styles.subCard}>
                  <Stack gap='xs'>
                    <Text fw={700}>{item.import_item.title || '(未填標題)'}</Text>
                    <Text size='sm' c='dimmed'>{item.import_item.post_url || '(未填網址)'}</Text>
                    {item.existing_posts.length > 0 && (
                      <Card withBorder bg='red.0'>
                        <Stack gap={6}>
                          <Text size='sm' fw={700} c='red'>
                            警告：這篇 Dcard 連結已存在於系統中
                          </Text>
                          {item.existing_posts.map((existingPost) => (
                            <Text key={existingPost.id} size='sm'>
                              {existingPost.course_name} / {existingPost.instructor} / {existingPost.semester ?? '-'}
                              {' '}({existingPost.source})
                            </Text>
                          ))}
                        </Stack>
                      </Card>
                    )}
                    {item.error ? (
                      <Text size='sm' c='red'>{item.error}</Text>
                    ) : [
                        ...item.matches,
                        ...(previewCourseLookupResult?.courses ?? [])
                          .filter((course) => !item.matches.some((match) => match.course_id === course.id))
                          .map((course) => ({
                            course_id: course.id,
                            course_name: course.course_name,
                            department: course.department,
                            instructor: course.instructor,
                            score: 1,
                            matched_keywords: [],
                          })),
                      ].length === 0 ? (
                      <Text size='sm' c='dimmed'>沒有可勾選的課程</Text>
                    ) : (
                      <Stack gap={6}>
                        {[
                          ...item.matches,
                          ...(previewCourseLookupResult?.courses ?? [])
                            .filter((course) => !item.matches.some((match) => match.course_id === course.id))
                            .map((course) => ({
                              course_id: course.id,
                              course_name: course.course_name,
                              department: course.department,
                              instructor: course.instructor,
                              score: 1,
                              matched_keywords: [],
                            })),
                        ].map((match) => (
                          <Checkbox
                            key={`${item.index}-${match.course_id}`}
                            checked={(selectedPreviewCourseIds[item.index] ?? []).includes(match.course_id)}
                            onChange={(event) =>
                              handleTogglePreviewCourse(item.index, match.course_id, event.currentTarget.checked)
                            }
                            label={`${match.course_name} / ${match.instructor} (ID: ${match.course_id}, score: ${match.score})`}
                            description={`${match.department || '未分類系所'} / ${getPreviewCourseKeywordPreview(match.course_id, match.matched_keywords).join(', ') || '未設定匹配關鍵字'}`}
                          />
                        ))}
                      </Stack>
                    )}

                  </Stack>
                </Card>
              ))}
            </Stack>
          </ScrollArea.Autosize>
          <Group justify='flex-end'>
            <Button
              variant='default'
              onClick={() => {
                setPreviewModalOpened(false)
                setPreviewCourseLookupKeyword('')
                setPreviewCourseKeywordOverrides({})
              }}
            >
              取消
            </Button>
            <Button onClick={() => void handleConfirmImport()} loading={dcardSourceMutation.isPending}>
              確認匯入
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={attachTarget !== null}
        onClose={() => {
          setAttachTarget(null)
          setAttachCourseKeywordOverrides({})
        }}
        title='將既有文章補掛到課程'
        size='lg'
        zIndex={1100}
      >
        <Stack>
          {attachTarget && (
            <Card withBorder className={styles.subCard}>
              <Stack gap={6}>
                <Text fw={700}>{attachTarget.title}</Text>
                <Text size='sm' c='dimmed'>{attachTarget.post_url}</Text>
                <Text size='sm' c='dimmed'>
                  目前課程：{[attachTarget.course_name, attachTarget.instructor, attachTarget.semester].filter(Boolean).join(' / ') || '-'}
                </Text>
              </Stack>
            </Card>
          )}

          <TextInput
            label='搜尋課程'
            placeholder='課名 / 老師 / 學期'
            value={attachCourseLookupKeyword}
            onChange={(event) => setAttachCourseLookupKeyword(event.currentTarget.value)}
          />

          <Text size='sm' c='dimmed'>
            搜尋現有課程後，可勾選一個或多個 course ID，並可為每門課選填匹配關鍵字。沒填寫就會送空。
          </Text>

          {attachCourseLookupKeyword.trim().length < 2 ? (
            <Text size='sm' c='dimmed'>至少輸入 2 個字才能開始搜尋。</Text>
          ) : isAttachCourseLookupLoading ? (
            <Group justify='center'><Loader size='sm' /></Group>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th></Table.Th>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>課程</Table.Th>
                  <Table.Th>系所</Table.Th>
                  <Table.Th>老師</Table.Th>
                  <Table.Th>學期</Table.Th>
                  <Table.Th>匹配關鍵字</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(attachCourseLookupResult?.courses ?? []).map((course) => (
                  <Table.Tr key={`attach-${course.id}`}>
                    <Table.Td>
                      <Checkbox
                        checked={selectedAttachCourseIds.includes(course.id)}
                        onChange={(event) => handleToggleAttachCourse(course.id, event.currentTarget.checked)}
                        aria-label={`attach-course-${course.id}`}
                      />
                    </Table.Td>
                    <Table.Td>{course.id}</Table.Td>
                    <Table.Td>{course.course_name}</Table.Td>
                    <Table.Td>{course.department || '-'}</Table.Td>
                    <Table.Td>{course.instructor}</Table.Td>
                    <Table.Td>{course.semester}</Table.Td>
                    <Table.Td>
                      <TextInput
                        size='xs'
                        placeholder='可選填，逗號分隔'
                        value={attachCourseKeywordOverrides[course.id] ?? ''}
                        onChange={(event) =>
                          handleAttachCourseKeywordChange(course.id, event.currentTarget.value)
                        }
                      />
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon
                        component='a'
                        href={`/course/${course.id}`}
                        target='_blank'
                        rel='noreferrer'
                        variant='light'
                        aria-label={`open-attach-course-${course.id}`}
                      >
                        <FiExternalLink size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {(attachCourseLookupResult?.courses ?? []).length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={8}>
                      <Text size='sm' c='dimmed'>找不到符合的課程。</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          )}

          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              已選擇：{selectedAttachCourseIds.length}
            </Text>
            <Group>
              <Button
                variant='default'
                onClick={() => {
                  setAttachTarget(null)
                  setAttachCourseKeywordOverrides({})
                }}
              >
                取消
              </Button>
              <Button onClick={() => void handleAttachRelatedPost()} loading={attachRelatedPostMutation.isPending}>
                補掛課程
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>

      <div className={styles.header}>
        <Title order={2}>相關貼文後台</Title>
        <Text c='dimmed'>手動匯入 Dcard 貼文，或以 Google 搜尋同步到課程詳情頁。</Text>
      </div>

      <Group gap='sm' className={styles.badges}>
        <Badge size='lg' variant='light'>manual_import: {countsMap.get('manual_import') ?? 0}</Badge>
        <Badge size='lg' variant='light'>google_search: {countsMap.get('google_search') ?? 0}</Badge>
        <Badge size='lg' variant='light'>dcard: {countsMap.get('dcard') ?? 0}</Badge>
      </Group>

      <div className={styles.grid}>
        <Card withBorder className={styles.card}>
          <Stack>
            <Group justify='space-between' align='center'>
              <Title order={4}>貼上 Dcard 頁面資料</Title>
              <Button variant='light' onClick={() => void handleCopySnippet()}>
                複製匯出腳本
              </Button>
            </Group>
            <Text size='sm' c='dimmed'>
              建議流程：先在 Dcard 文章頁打開瀏覽器 console，貼上匯出腳本，複製產出的 JSON 後回來貼上。也可以直接貼完整 HTML。若同一篇 Dcard 文章已存在，系統只會更新那篇，不會整批覆蓋其他資料。
            </Text>
            <Textarea
              label='瀏覽器匯出 JSON 或完整 HTML'
              minRows={12}
              autosize
              value={dcardSourceInput}
              onChange={(event) => setDcardSourceInput(event.currentTarget.value)}
              className={styles.textarea}
            />
            <Accordion variant='separated'>
              <Accordion.Item value='dcard-script'>
                <Accordion.Control>查看 Dcard 匯出腳本</Accordion.Control>
                <Accordion.Panel>
                  <Textarea
                    readOnly
                    minRows={10}
                    autosize
                    value={dcardExportSnippet}
                    className={styles.textarea}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
            <Button
              onClick={() => void handleOpenDcardSourcePreview()}
              loading={previewDcardSourceMutation.isPending}
            >
              預覽後匯入 Dcard 頁面資料
            </Button>
          </Stack>
        </Card>


        <Card withBorder className={styles.card}>
          <Stack>
            <Title order={4}>Google 搜尋同步</Title>
            <NumberInput
              label='課程數上限'
              min={1}
              max={200}
              value={googleLimit}
              onChange={(value) => setGoogleLimit(Number(value) || 30)}
            />
            <NumberInput
              label='每門課最多取幾筆結果'
              min={1}
              max={10}
              value={googleMaxResults}
              onChange={(value) => setGoogleMaxResults(Number(value) || 5)}
            />
            <TextInput
              label='指定學期'
              placeholder='例如 114-2'
              value={semester}
              onChange={(event) => setSemester(event.currentTarget.value)}
            />
            <Checkbox
              checked={onlyUnreviewed}
              onChange={(event) => setOnlyUnreviewed(event.currentTarget.checked)}
              label='只同步尚未有評價的課程'
            />
            <Checkbox
              checked={replaceGoogle}
              onChange={(event) => setReplaceGoogle(event.currentTarget.checked)}
              label='覆蓋這批課程既有的 google_search 資料'
            />
            <Button onClick={() => void handleGoogleSync()} loading={googleSyncMutation.isPending}>
              開始 Google 同步
            </Button>
          </Stack>
        </Card>
      </div>

      <Card withBorder className={styles.card}>
        <Stack>
          <Title order={4}>最近寫入的貼文</Title>
          {isLoading ? (
            <Group justify='center'><Loader /></Group>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>來源</Table.Th>
                  <Table.Th>課程</Table.Th>
                  <Table.Th>老師</Table.Th>
                  <Table.Th>學期</Table.Th>
                  <Table.Th>標題</Table.Th>
                  <Table.Th>匹配關鍵字</Table.Th>
                  <Table.Th>同步時間</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(overview?.recentPosts ?? []).map((post) => (
                  <Table.Tr key={post.id}>
                    <Table.Td>{post.source}</Table.Td>
                    <Table.Td>{post.course_name || '-'}</Table.Td>
                    <Table.Td>{post.instructor || '-'}</Table.Td>
                    <Table.Td>{post.semester || '-'}</Table.Td>
                    <Table.Td>
                      <a href={post.post_url} target='_blank' rel='noreferrer' className={styles.link}>
                        {post.title}
                      </a>
                    </Table.Td>
                    <Table.Td>{post.matched_keywords.join(', ') || '-'}</Table.Td>
                    <Table.Td>{new Date(post.synced_at).toLocaleString()}</Table.Td>
                    <Table.Td>
                      <Group gap='xs' justify='flex-end' wrap='nowrap'>
                        {post.course_id && (
                          <ActionIcon
                            component='a'
                            href={`/course/${post.course_id}`}
                            target='_blank'
                            rel='noreferrer'
                            variant='light'
                            aria-label={`open-course-${post.course_id}`}
                          >
                            <FiExternalLink size={16} />
                          </ActionIcon>
                        )}
                        <ActionIcon
                          variant='light'
                          aria-label={`attach-related-post-${post.id}`}
                          onClick={() =>
                            handleOpenAttachModal({
                              id: post.id,
                              post_id: post.post_id,
                              title: post.title,
                              post_url: post.post_url,
                              course_name: post.course_name,
                              instructor: post.instructor,
                              semester: post.semester,
                            })
                          }
                        >
                          <FiLink2 size={16} />
                        </ActionIcon>
                        <ActionIcon
                          color='red'
                          variant='light'
                          aria-label={`delete-related-post-${post.id}`}
                          onClick={() =>
                            setDeleteTarget({
                              id: post.id,
                              title: post.title,
                              course_name: post.course_name,
                              instructor: post.instructor,
                              semester: post.semester,
                            })
                          }
                          loading={deleteRelatedPostMutation.isPending}
                        >
                          <FiTrash2 size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
          {(overview?.recentPostsPagination.totalPages ?? 1) > 1 && (
            <Group justify='flex-end'>
              <Pagination
                value={recentPostsPage}
                onChange={setRecentPostsPage}
                total={overview?.recentPostsPagination.totalPages ?? 1}
              />
            </Group>
          )}
        </Stack>
      </Card>

      <Card withBorder className={styles.card}>
        <Stack>
          <Title order={4}>最近匯入紀錄</Title>
          {isLoading ? (
            <Group justify='center'><Loader /></Group>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>類型</Table.Th>
                  <Table.Th>建立者</Table.Th>
                  <Table.Th>建立時間</Table.Th>
                  <Table.Th>摘要</Table.Th>
                  <Table.Th></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(overview?.recentImports ?? []).map((record) => {
                  const summary = record.import_result_summary as {
                    importedRows?: number;
                    matchedCourses?: number;
                    parsed_items_count?: number;
                    imported_courses?: Array<{
                      course_id: number;
                      course_name: string;
                      instructor: string;
                      semester: string | null;
                    }>;
                  } | null
                  return (
                    <Table.Tr key={record.id}>
                      <Table.Td>{record.source_type}</Table.Td>
                      <Table.Td>{record.created_by_name || '-'}</Table.Td>
                      <Table.Td>{new Date(record.created_at).toLocaleString()}</Table.Td>
                      <Table.Td>
                        {summary ? (
                          <Stack gap={4}>
                            <Text size='sm'>
                              解析 {summary.parsed_items_count ?? 0} 筆 / 寫入 {summary.importedRows ?? 0} 筆 / 命中 {summary.matchedCourses ?? 0} 門課
                            </Text>
                            {(summary.imported_courses?.length ?? 0) > 0 && (
                              <Stack gap={2}>
                                {summary!.imported_courses!.map((course) => (
                                  <Text key={`${record.id}-${course.course_id}`} size='sm' c='dimmed'>
                                    {course.course_name} / {course.instructor} / {course.semester ?? '-'}
                                  </Text>
                                ))}
                              </Stack>
                            )}
                          </Stack>
                        ) : '-'}
                      </Table.Td>
                      <Table.Td className={styles.copyCell}>
                        <Group gap='xs' justify='flex-end' wrap='nowrap'>
                          <ActionIcon
                            variant='light'
                            aria-label={`copy-import-record-${record.id}`}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(record.raw_payload)
                                notifications.show({
                                  title: '已複製',
                                  message: `匯入紀錄 ${record.id} 已複製到剪貼簿`,
                                  color: 'green',
                                })
                              } catch {
                                notifications.show({
                                  title: '複製失敗',
                                  message: '請稍後再試',
                                  color: 'red',
                                })
                              }
                            }}
                          >
                            <FiCopy size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color='red'
                            variant='light'
                            aria-label={`delete-import-record-${record.id}`}
                            onClick={() =>
                              setDeleteImportTarget({
                                id: record.id,
                                source_type: record.source_type,
                                created_by_name: record.created_by_name,
                                created_at: record.created_at,
                              })
                            }
                            loading={deleteRelatedPostImportMutation.isPending}
                          >
                            <FiTrash2 size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          )}
          {(overview?.recentImportsPagination.totalPages ?? 1) > 1 && (
            <Group justify='flex-end'>
              <Pagination
                value={recentImportsPage}
                onChange={setRecentImportsPage}
                total={overview?.recentImportsPagination.totalPages ?? 1}
              />
            </Group>
          )}
        </Stack>
      </Card>
    </Container>
  )
}

export default AdminRelatedPostsPage
