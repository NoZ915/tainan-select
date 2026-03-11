import { useMemo, useState } from 'react'
import {
  Accordion,
  ActionIcon,
  Badge,
  Button,
  Card,
  Checkbox,
  Code,
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
import { FiCopy, FiExternalLink, FiTrash2 } from 'react-icons/fi'
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

  const [dcardSourceInput, setDcardSourceInput] = useState('')
  const [previewModalOpened, setPreviewModalOpened] = useState(false)
  const [importPreviewResult, setImportPreviewResult] = useState<ManualImportPreviewResponse | null>(null)
  const [selectedPreviewCourseIds, setSelectedPreviewCourseIds] = useState<Record<number, number[]>>({})
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
  const [googleLimit, setGoogleLimit] = useState<number>(30)
  const [googleMaxResults, setGoogleMaxResults] = useState<number>(5)
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(true)
  const [replaceGoogle, setReplaceGoogle] = useState(false)
  const [semester, setSemester] = useState('')
  const [courseLookupKeyword, setCourseLookupKeyword] = useState('')

  const courseLookupSearchParams = useMemo(() => ({
    page: 1,
    limit: 8,
    search: courseLookupKeyword.trim(),
    category: 'all',
    academy: '',
    department: '',
    courseType: '',
    weekdays: [],
    periods: [],
    semesters: [],
    sortBy: 'viewDesc',
  }), [courseLookupKeyword])

  const {
    data: courseLookupResult,
    isLoading: isCourseLookupLoading,
  } = useGetCourses(courseLookupSearchParams, courseLookupKeyword.trim().length >= 2)

  const countsMap = useMemo(
    () => new Map((overview?.counts ?? []).map((item) => [item.source, item.count])),
    [overview?.counts]
  )

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

  const handleConfirmImport = async () => {
    if (!importPreviewResult) return

    const finalItems = importPreviewResult.items.reduce<ManualImportPayloadItem[]>((acc, item) => {
      if (item.error) return acc

      const selectedIds = selectedPreviewCourseIds[item.index] ?? []
      if (selectedIds.length === 0) return acc

      acc.push({
        ...item.import_item,
        course_ids: selectedIds,
      })

      return acc
    }, [])

    if (finalItems.length === 0) {
      notifications.show({
        title: '沒有可匯入項目',
        message: '請至少勾選一門課程後再匯入。',
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
      notifications.show({
        title: '匯入完成',
        message: `寫入 ${result.importedRows} 筆，命中 ${result.matchedCourses} 門課，未命中 ${result.unmatchedItems} 筆。`,
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: '匯入失敗',
        message: error instanceof Error ? error.message : '匯入失敗',
        color: 'red',
      })
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
      setPreviewModalOpened(true)
    } catch (error) {
      notifications.show({
        title: 'Dcard 預覽失敗',
        message: error instanceof Error ? error.message : '請檢查貼上的內容',
        color: 'red',
      })
    }
  }

  const handleCopyCourseId = async (courseId: number) => {
    try {
      await navigator.clipboard.writeText(String(courseId))
      notifications.show({
        title: '已複製',
        message: `course_id ${courseId} 已複製到剪貼簿`,
        color: 'green',
      })
    } catch {
      notifications.show({
        title: '複製失敗',
        message: '請手動複製 course_id',
        color: 'red',
      })
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
        onClose={() => setPreviewModalOpened(false)}
        title='匯入前確認課程'
        size='xl'
        zIndex={1100}
      >
        <Stack>
          <Text size='sm' c='dimmed'>
            勾選這次要綁定的課程。只有勾選的課程會真的寫入 DB。
          </Text>
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
                    ) : item.matches.length === 0 ? (
                      <Text size='sm' c='dimmed'>沒有可勾選的課程</Text>
                    ) : (
                      <Stack gap={6}>
                        {item.matches.map((match) => (
                          <Checkbox
                            key={`${item.index}-${match.course_id}`}
                            checked={(selectedPreviewCourseIds[item.index] ?? []).includes(match.course_id)}
                            onChange={(event) =>
                              handleTogglePreviewCourse(item.index, match.course_id, event.currentTarget.checked)
                            }
                            label={`${match.course_name} / ${match.instructor} (ID: ${match.course_id}, score: ${match.score})`}
                            description={match.matched_keywords.join(', ')}
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
            <Button variant='default' onClick={() => setPreviewModalOpened(false)}>取消</Button>
            <Button onClick={() => void handleConfirmImport()} loading={dcardSourceMutation.isPending}>
              確認匯入
            </Button>
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
            <Title order={4}>course_id 查詢輔助</Title>
            <TextInput
              label='輸入課名或老師名'
              placeholder='例如 教育心理學 / 王老師'
              value={courseLookupKeyword}
              onChange={(event) => setCourseLookupKeyword(event.currentTarget.value)}
            />
            <Text size='sm' c='dimmed'>
              如果你想手動指定 <Code>course_ids</Code>，先在這裡查，右側按鈕可以直接複製 id。
            </Text>
            {courseLookupKeyword.trim().length < 2 ? (
              <Text size='sm' c='dimmed'>至少輸入 2 個字開始查詢。</Text>
            ) : isCourseLookupLoading ? (
              <Group justify='center'><Loader size='sm' /></Group>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>課名</Table.Th>
                    <Table.Th>老師</Table.Th>
                    <Table.Th>學期</Table.Th>
                    <Table.Th></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {(courseLookupResult?.courses ?? []).map((course) => (
                    <Table.Tr key={course.id}>
                      <Table.Td>{course.id}</Table.Td>
                      <Table.Td>{course.course_name}</Table.Td>
                      <Table.Td>{course.instructor}</Table.Td>
                      <Table.Td>{course.semester}</Table.Td>
                      <Table.Td className={styles.copyCell}>
                        <ActionIcon
                          variant='light'
                          aria-label={`copy-${course.id}`}
                          onClick={() => void handleCopyCourseId(course.id)}
                        >
                          <FiCopy size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                  {(courseLookupResult?.courses ?? []).length === 0 && (
                    <Table.Tr>
                      <Table.Td colSpan={5}>
                        <Text size='sm' c='dimmed'>找不到符合的課程</Text>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            )}
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
