import { useState } from 'react'
import { Avatar, Badge, Box, Button, Card, Group, Select, Stack, Text, Textarea, Tooltip } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { FaEdit, FaRegThumbsUp, FaThumbsUp } from 'react-icons/fa'
import { RiDeleteBin6Fill } from 'react-icons/ri'

import { FeatureRequest, FeatureRequestStatus } from '../types/featureRequestType'
import { useToggleFeatureRequestVote } from '../hooks/featureRequests/useToggleFeatureRequestVote'
import { useUpdateFeatureRequestStatus } from '../hooks/featureRequests/useUpdateFeatureRequestStatus'
import { useUpdateFeatureRequestAdminReply } from '../hooks/featureRequests/useUpdateFeatureRequestAdminReply'
import { getAvatarSrc } from '../utils/avatarUrl'
import styles from '../styles/pages/WishlistPage.module.css'

const MAX_ADMIN_REPLY_LENGTH = 500

const STATUS_LABEL: Record<FeatureRequestStatus, string> = {
  pending: '許願中',
  in_progress: '進行中',
  completed: '已完成',
}

const STATUS_COLOR: Record<FeatureRequestStatus, string> = {
  pending: 'gray',
  in_progress: 'blue',
  completed: 'green',
}

const STATUS_SELECT_DATA = (Object.keys(STATUS_LABEL) as FeatureRequestStatus[]).map((status) => ({
  value: status,
  label: STATUS_LABEL[status],
}))

interface FeatureRequestCardProps {
  item: FeatureRequest;
  isAuthenticated: boolean;
  isAdmin: boolean;
  onRequireLogin: () => void;
  onRequestDelete: (item: FeatureRequest) => void;
}

const FeatureRequestCard: React.FC<FeatureRequestCardProps> = ({
  item,
  isAuthenticated,
  isAdmin,
  onRequireLogin,
  onRequestDelete,
}) => {
  const [isEditingReply, setIsEditingReply] = useState(false)
  const [replyDraft, setReplyDraft] = useState(item.admin_reply ?? '')

  const { mutate: toggleVote, isPending: isTogglingVote } = useToggleFeatureRequestVote()
  const { mutate: updateStatus } = useUpdateFeatureRequestStatus()
  const { mutate: updateAdminReply, isPending: isSavingReply } = useUpdateFeatureRequestAdminReply()

  const handleToggleVote = () => {
    if (!isAuthenticated) {
      onRequireLogin()
      return
    }
    toggleVote(item.id, {
      onError: (error) => {
        notifications.show({ title: '投票失敗', message: error instanceof Error ? error.message : '請稍後再試', color: 'red' })
      },
    })
  }

  const startEditReply = () => {
    setReplyDraft(item.admin_reply ?? '')
    setIsEditingReply(true)
  }

  const handleSaveReply = () => {
    const trimmed = replyDraft.trim()
    if (trimmed.length > MAX_ADMIN_REPLY_LENGTH) {
      notifications.show({ title: '無法儲存', message: `回覆最多 ${MAX_ADMIN_REPLY_LENGTH} 字`, color: 'red' })
      return
    }

    updateAdminReply(
      { id: item.id, admin_reply: trimmed },
      {
        onSuccess: () => setIsEditingReply(false),
        onError: (error) => {
          notifications.show({ title: '儲存失敗', message: error instanceof Error ? error.message : '請稍後再試', color: 'red' })
        },
      }
    )
  }

  const avatarSrc = getAvatarSrc(item.UserModel?.avatar)

  return (
    <Card className={styles.card}>
      <Group justify='space-between' align='flex-start' wrap='nowrap' className={styles.headerRow}>
        <Group className={styles.userInfo}>
          <Avatar variant='light' size='lg' color='brick-red.6' src={avatarSrc} />
          <Box className={styles.userMeta}>
            <Text>{item.UserModel?.name ?? '匿名'}</Text>
            <Text size='xs' c='dimmed'>{new Date(item.created_at).toLocaleString()}</Text>
          </Box>
        </Group>
        <Badge color={STATUS_COLOR[item.status]} variant='light'>
          {STATUS_LABEL[item.status]}
        </Badge>
      </Group>

      <Text className={styles.contentText} mt='sm'>{item.content}</Text>

      {isEditingReply ? (
        <Stack gap={4} className={styles.replyEditBox}>
          <Textarea
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.currentTarget.value)}
            placeholder='輸入官方回覆'
            minRows={2}
            autosize
            maxLength={MAX_ADMIN_REPLY_LENGTH}
          />
          <Group justify='flex-end' gap='xs'>
            <Button size='compact-xs' variant='subtle' onClick={() => setIsEditingReply(false)}>取消</Button>
            <Button size='compact-xs' onClick={handleSaveReply} loading={isSavingReply}>儲存</Button>
          </Group>
        </Stack>
      ) : item.admin_reply ? (
        <div className={styles.replyBox}>
          <Group justify='space-between' align='flex-start' wrap='nowrap'>
            <Stack gap={2}>
              <Text size='xs' fw={700} c='brick-red.7'>官方回覆</Text>
              <Text size='sm' className={styles.contentText}>{item.admin_reply}</Text>
            </Stack>
            {isAdmin && (
              <Button size='compact-xs' variant='subtle' leftSection={<FaEdit size={12} />} onClick={startEditReply}>
                編輯
              </Button>
            )}
          </Group>
        </div>
      ) : (
        isAdmin && (
          <Button size='compact-xs' variant='subtle' mt='xs' onClick={startEditReply}>
            新增官方回覆
          </Button>
        )
      )}

      <Group justify='space-between' mt='sm'>
        <Tooltip label={isAuthenticated ? '按讚支持' : '請先登入才能按讚'}>
          <Button
            variant={item.has_voted ? 'filled' : 'light'}
            color='brick-red.6'
            size='xs'
            leftSection={item.has_voted ? <FaThumbsUp size={14} /> : <FaRegThumbsUp size={14} />}
            onClick={handleToggleVote}
            disabled={isTogglingVote}
            loading={isTogglingVote}
          >
            {item.vote_count}
          </Button>
        </Tooltip>

        {isAuthenticated && (isAdmin || item.is_owner) && (
          <Group gap='xs'>
            {isAdmin && (
              <Select
                size='xs'
                data={STATUS_SELECT_DATA}
                value={item.status}
                allowDeselect={false}
                onChange={(value) => value && updateStatus({ id: item.id, status: value as FeatureRequestStatus })}
                className={styles.statusSelect}
              />
            )}
            <Button
              variant='subtle'
              color='red'
              size='xs'
              leftSection={<RiDeleteBin6Fill size={14} />}
              onClick={() => onRequestDelete(item)}
            >
              刪除
            </Button>
          </Group>
        )}
      </Group>
    </Card>
  )
}

export default FeatureRequestCard
