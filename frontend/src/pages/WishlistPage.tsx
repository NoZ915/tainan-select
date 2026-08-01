import { useMemo, useState } from 'react'
import { Button, Card, Container, Group, Loader, Stack, Tabs, Text, Textarea, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FaPlus } from 'react-icons/fa'

import { useAuthStore } from '../stores/authStore'
import { useGetAdminStatus } from '../hooks/admin/useGetAdminStatus'
import { useGetFeatureRequests } from '../hooks/featureRequests/useGetFeatureRequests'
import { useCreateFeatureRequest } from '../hooks/featureRequests/useCreateFeatureRequest'
import { useDeleteFeatureRequest } from '../hooks/featureRequests/useDeleteFeatureRequest'
import { FeatureRequest, FeatureRequestStatus } from '../types/featureRequestType'
import LoginModal from '../components/LoginModal'
import ConfirmModal from '../components/ConfirmModal'
import FeatureRequestCard from '../components/FeatureRequestCard'
import styles from '../styles/pages/WishlistPage.module.css'

const MAX_CONTENT_LENGTH = 500

type TabValue = FeatureRequestStatus | 'all'

const TABS: { value: TabValue; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '許願中' },
  { value: 'in_progress', label: '進行中' },
  { value: 'completed', label: '已完成' },
]

const WishlistPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore()
  const { data: adminStatus } = useGetAdminStatus()
  const isAdmin = Boolean(adminStatus?.isAdmin)

  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [content, setContent] = useState('')
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FeatureRequest | null>(null)

  const status = activeTab === 'all' ? undefined : activeTab
  const { data: featureRequests, isLoading, isError, isFetching, refetch } = useGetFeatureRequests(status)

  const { mutate: createFeatureRequest, isPending: isCreating } = useCreateFeatureRequest()
  const { mutate: removeFeatureRequest, isPending: isDeleting } = useDeleteFeatureRequest()

  const items = useMemo(() => featureRequests ?? [], [featureRequests])

  const EMPTY_MESSAGES: Record<TabValue, string> = {
    all: '目前還沒有許願，快來許下第一個吧！',
    pending: '目前沒有「許願中」的功能建議，快來提出你的想法吧！',
    in_progress: '目前沒有進行中的許願，開發中功能會顯示在這裡。',
    completed: '目前尚未有已完成的許願。',
  }

  const handleOpenComposer = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true)
      return
    }
    setIsComposerOpen(true)
  }

  const handleSubmit = () => {
    const trimmed = content.trim()
    if (!trimmed) {
      notifications.show({ title: '無法送出', message: '請輸入許願內容', color: 'red' })
      return
    }
    if (trimmed.length > MAX_CONTENT_LENGTH) {
      notifications.show({ title: '無法送出', message: `許願內容最多 ${MAX_CONTENT_LENGTH} 字`, color: 'red' })
      return
    }

    createFeatureRequest(trimmed, {
      onSuccess: () => {
        setContent('')
        setIsComposerOpen(false)
        notifications.show({ title: '許願成功', message: '感謝你的建議！', color: 'green' })
      },
      onError: (error) => {
        notifications.show({ title: '送出失敗', message: error instanceof Error ? error.message : '請稍後再試', color: 'red' })
      },
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    removeFeatureRequest(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: (error) => {
        notifications.show({ title: '刪除失敗', message: error instanceof Error ? error.message : '請稍後再試', color: 'red' })
      },
    })
  }

  return (
    <Container size='md' py='lg'>
      <Stack gap='md'>
        <Stack gap={6} className={styles.heading}>
          <Title order={2}>功能許願</Title>
          <Text c='dimmed' size='sm'>提出你想要的功能，或幫其他人的許願按讚支持！</Text>
        </Stack>

        {isComposerOpen ? (
          <Card className={styles.composer}>
            <Textarea
              placeholder='想新增什麼功能呢？'
              minRows={3}
              autosize
              maxLength={MAX_CONTENT_LENGTH}
              value={content}
              autoFocus
              onChange={(event) => setContent(event.currentTarget.value)}
            />
            <Group justify='flex-end' mt='sm' gap='xs'>
              <Button variant='subtle' onClick={() => setIsComposerOpen(false)}>取消</Button>
              <Button onClick={handleSubmit} loading={isCreating}>送出許願</Button>
            </Group>
          </Card>
        ) : (
          <Button
            variant='light'
            color='brick-red.6'
            leftSection={<FaPlus size={14} />}
            onClick={handleOpenComposer}
            className={styles.composerToggle}
          >
            {isAuthenticated ? '新增許願' : '登入後即可許願'}
          </Button>
        )}

        <Tabs value={activeTab} onChange={(value) => setActiveTab((value as TabValue) ?? 'all')}>
          <Tabs.List>
            {TABS.map((tab) => (
              <Tabs.Tab key={tab.value} value={tab.value}>{tab.label}</Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>

        {isLoading ? (
          <Group justify='center' py='xl'>
            <Loader size='sm' />
          </Group>
        ) : isError ? (
          <Stack align='center' gap='xs' py='xl'>
            <Text c='red.6' ta='center'>載入功能許願失敗，請稍後再試。</Text>
            <Button
              variant='light'
              color='brick-red.6'
              loading={isFetching}
              onClick={() => void refetch()}
            >
              重新載入
            </Button>
          </Stack>
        ) : items.length === 0 ? (
          <Text c='dimmed' ta='center' py='xl'>{EMPTY_MESSAGES[activeTab]}</Text>
        ) : (
          <Stack gap='sm'>
            {items.map((item) => (
              <FeatureRequestCard
                key={item.id}
                item={item}
                isAuthenticated={isAuthenticated}
                isAdmin={isAdmin}
                onRequireLogin={() => setIsLoginModalOpen(true)}
                onRequestDelete={setDeleteTarget}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <LoginModal opened={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} title='登入 / 註冊' />
      <ConfirmModal
        opened={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title='刪除許願'
        message='確定要刪除這則許願嗎？一經刪除將無法復原。'
        confirmText='刪除'
        cancelText='取消'
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </Container>
  )
}

export default WishlistPage
