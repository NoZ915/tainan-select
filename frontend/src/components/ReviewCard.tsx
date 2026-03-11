import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ActionIcon, Avatar, Box, Button, Card, Group, Loader, Menu, Rating, Text, Textarea } from '@mantine/core'
import { BsThreeDots } from 'react-icons/bs'
import { FaEdit } from 'react-icons/fa'
import { FiLock, FiMessageCircle, FiSend } from 'react-icons/fi'
import { RiDeleteBin6Fill } from 'react-icons/ri'
import style from '../styles/components/ReviewCard.module.css'

import { ReviewComment, ReviewsResponse } from '../types/reviewType'
import { Course } from '../types/courseType'
import { useAuthStore } from '../stores/authStore'
import { ReactionPreset, ReviewReactionSummary } from '../types/reactionType'

import AddOrEditReviewModal from './AddOrEditReviewModal'
import ConfirmModal from './ConfirmModal'
import { useDeleteReview } from '../hooks/reviews/useDeleteReview'

import { useGetReactionPresets } from '../hooks/reactions/useGetReactionPresets'
import { useToggleReviewReaction } from '../hooks/reactions/useToggleReviewReaction'
import { getAvatarSrc, getStaticAssetSrc } from '../utils/avatarUrl'
import { useGetReviewComments } from '../hooks/reviews/useGetReviewComments'
import { useCreateReviewComment } from '../hooks/reviews/useCreateReviewComment'
import { useDeleteReviewComment } from '../hooks/reviews/useDeleteReviewComment'
import { useUpdateReviewComment } from '../hooks/reviews/useUpdateReviewComment'

interface ReviewCardProp {
  review: ReviewsResponse,
  course: { course: Course } | null | undefined;
}

const ReviewCard: React.FC<ReviewCardProp> = ({ review, course }) => {
  const { user } = useAuthStore()

  const [isAddOrEditReviewModalOpen, setIsAddOrEditReviewModalOpen] = useState(false)
  const [isDeleteReviewModalOpen, setIsDeleteReviewModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewsResponse | null>(null)
  const [isCommentExpanded, setIsCommentExpanded] = useState(false)
  const [isCommentTruncated, setIsCommentTruncated] = useState(false)
  const commentElementRef = useRef<HTMLParagraphElement | null>(null)
  const [reactionSummary, setReactionSummary] = useState<ReviewReactionSummary>(review.reactions ?? { counts: {}, myReactions: [] })

  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [commentError, setCommentError] = useState('')
  const [commentCount, setCommentCount] = useState(review.comment_count ?? 0)

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [editingError, setEditingError] = useState('')

  const { data: presetsResponse } = useGetReactionPresets()
  const presets = useMemo(() => presetsResponse?.items ?? [], [presetsResponse?.items])
  const presetByKey = useMemo(
    () => new Map<string, ReactionPreset>(presets.map((preset) => [preset.key, preset])),
    [presets]
  )

  const { mutate: toggleReaction, isPending: isTogglingReaction } = useToggleReviewReaction()
  const {
    data: comments,
    isLoading: isCommentsLoading,
    isError: isCommentsError,
  } = useGetReviewComments(review.id, isCommentsOpen)
  const resolvedComments = comments ?? []
  const { mutate: createComment, isPending: isCreatingComment } = useCreateReviewComment(review.id)
  const { mutate: deleteComment, isPending: isDeletingComment } = useDeleteReviewComment(review.id)
  const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateReviewComment(review.id)

  const handleEdit = (targetReview: ReviewsResponse) => {
    setIsAddOrEditReviewModalOpen(true)
    setSelectedReview(targetReview)
  }

  const { mutate, isPending } = useDeleteReview()
  const handleConfirmDelete = (targetReview: ReviewsResponse) => {
    mutate(targetReview.id, {
      onSuccess: () => setIsDeleteReviewModalOpen(false),
    })
  }

  const handleDeleteModal = (targetReview: ReviewsResponse) => {
    setIsDeleteReviewModalOpen(true)
    setSelectedReview(targetReview)
  }

  const getReactionDisplay = (preset: ReactionPreset | undefined, key: string): string => {
    if (!preset) return key
    if (preset.type === 'unicode') return preset.unicode ?? preset.label
    return preset.label
  }

  const sortedReactionKeys = useMemo(() => {
    const countKeys = Object.keys(reactionSummary.counts).filter((key) => (reactionSummary.counts[key] ?? 0) > 0)
    const knownKeys = presets
      .map((preset) => preset.key)
      .filter((key) => countKeys.includes(key))
    const unknownKeys = countKeys.filter((key) => !presetByKey.has(key)).sort()
    return [...knownKeys, ...unknownKeys]
  }, [reactionSummary.counts, presets, presetByKey])

  const myReactionSet = useMemo(
    () => new Set(reactionSummary.myReactions),
    [reactionSummary.myReactions]
  )

  const handleToggleReaction = (key: string) => {
    if (!user) return

    toggleReaction(
      { review_id: review.id, key },
      {
        onSuccess: (result) => {
          setReactionSummary((prev) => {
            const nextMyReactions = result.action === 'added'
              ? Array.from(new Set([...prev.myReactions, key]))
              : prev.myReactions.filter((reactionKey) => reactionKey !== key)
            return {
              counts: result.counts,
              myReactions: nextMyReactions,
            }
          })
        },
      }
    )
  }

  const handleSubmitComment = () => {
    const normalizedComment = commentInput.trim()
    if (normalizedComment.length === 0) {
      setCommentError('留言不能是空白')
      return
    }
    if (normalizedComment.length > 500) {
      setCommentError('留言最多 500 字')
      return
    }

    createComment(normalizedComment, {
      onSuccess: () => {
        setCommentInput('')
        setCommentError('')
        setCommentCount((prev) => prev + 1)
      },
      onError: () => {
        setCommentError('留言送出失敗，請稍後再試')
      },
    })
  }

  const handleDeleteComment = (commentId: number) => {
    deleteComment(commentId, {
      onSuccess: () => {
        setCommentCount((prev) => Math.max(prev - 1, 0))
      },
    })
  }

  const startEditComment = (comment: ReviewComment) => {
    setEditingCommentId(comment.id)
    setEditingContent(comment.content)
    setEditingError('')
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingContent('')
    setEditingError('')
  }

  const saveEditComment = (commentId: number) => {
    const normalizedContent = editingContent.trim()
    if (!normalizedContent) {
      setEditingError('留言不能是空白')
      return
    }
    if (normalizedContent.length > 500) {
      setEditingError('留言最多 500 字')
      return
    }

    updateComment(
      { comment_id: commentId, content: normalizedContent },
      {
        onSuccess: () => {
          cancelEditComment()
        },
        onError: () => {
          setEditingError('更新留言失敗，請稍後再試')
        },
      }
    )
  }

  useEffect(() => {
    setIsCommentExpanded(false)
  }, [review.comment])

  useEffect(() => {
    setReactionSummary(review.reactions ?? { counts: {}, myReactions: [] })
  }, [review.reactions])

  useEffect(() => {
    setCommentCount(review.comment_count ?? 0)
  }, [review.comment_count])

  useEffect(() => {
    if (isCommentsOpen && !isCommentsLoading && comments) {
      setCommentCount(comments.length)
    }
  }, [isCommentsOpen, isCommentsLoading, comments])

  useEffect(() => {
    const el = commentElementRef.current
    if (!el) return

    const checkTruncate = () => {
      if (isCommentExpanded) {
        setIsCommentTruncated(false)
        return
      }
      setIsCommentTruncated(el.scrollHeight > el.clientHeight + 1)
    }

    const scheduleCheck = () => {
      requestAnimationFrame(checkTruncate)
    }

    scheduleCheck()

    const resizeObserver = new ResizeObserver(scheduleCheck)
    resizeObserver.observe(el)
    window.addEventListener('resize', scheduleCheck)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', scheduleCheck)
    }
  }, [isCommentExpanded, review.comment])

  const reviewerName = review.is_owner
    ? (user?.name ?? review.UserModel?.name ?? '匿名')
    : (review.UserModel?.name ?? '匿名')

  const reviewerAvatar = review.is_owner
    ? (user ? (user.avatar ?? null) : (review.UserModel?.avatar ?? null))
    : (review.UserModel?.avatar ?? null)

  const avatarSrc = getAvatarSrc(reviewerAvatar)

  return (
    <Card className={style.card}>
      <Card.Section className={style.cardSection}>
        <Group justify='space-between' className={style.headerRow}>
          <Group className={style.userInfo}>
            <Avatar variant='light' size='lg' color='brick-red.6' src={avatarSrc} />
            <Box className={style.userMeta}>
              <Text>{reviewerName}</Text>
              <Text size='xs' c='dimmed'>{new Date(review.updated_at).toLocaleString()}</Text>
            </Box>
          </Group>
          {review.is_owner && (
            <Menu>
              <Menu.Target>
                <ActionIcon variant='subtle' size='lg' radius='md' className={style.menuButton}>
                  <BsThreeDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown className={style.dropdown}>
                <Menu.Item
                  leftSection={<FaEdit size={16} />}
                  classNames={{ itemLabel: style.itemLabel }}
                  onClick={() => handleEdit(review)}
                >
                  編輯
                </Menu.Item>
                <Menu.Item
                  leftSection={<RiDeleteBin6Fill size={16} />}
                  classNames={{ itemLabel: style.itemLabel }}
                  color='red'
                  onClick={() => handleDeleteModal(review)}
                >
                  刪除
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
        {course && (
          <AddOrEditReviewModal
            opened={isAddOrEditReviewModalOpen}
            onClose={() => setIsAddOrEditReviewModalOpen(false)}
            course={course}
            review={selectedReview}
          />
        )}
        {course && (
          <ConfirmModal
            opened={isDeleteReviewModalOpen}
            onClose={() => setIsDeleteReviewModalOpen(false)}
            title='刪除評論'
            message='確定要刪除評論嗎？一經刪除將無法復原。'
            confirmText='刪除'
            cancelText='取消'
            loading={isPending}
            onConfirm={() => selectedReview && handleConfirmDelete(selectedReview)}
          />
        )}
      </Card.Section>

      <Card.Section className={style.cardSection}>
        <Text size='md' fw={900} className={style.courseName}>
          <Link to={`/course/${course?.course.id}`} className={style.link}>
            {course?.course.course_name} / {course?.course.instructor}
          </Link>
        </Text>
      </Card.Section>

      <Card.Section className={style.cardSection}>
        <div className={style.ratingsBox}>
          <Group className={style.ratings}>
            <Group className={style.ratingItem}>
              <Text>收穫</Text>
              <Rating value={review.gain} color='brick-red.6' size='md' fractions={2} readOnly />
            </Group>

            <Group className={style.ratingItem}>
              <Text>甜度</Text>
              <Rating value={review.sweetness} color='brick-red.6' size='md' fractions={2} readOnly />
            </Group>

            <Group className={style.ratingItem}>
              <Text>涼度</Text>
              <Rating value={review.coolness} color='brick-red.6' size='md' fractions={2} readOnly />
            </Group>
          </Group>
        </div>
      </Card.Section>

      <Card.Section className={style.cardSection}>
        <div className={style.commentBlock}>
          <Text
            ref={commentElementRef}
            className={`${style.commentText}${isCommentExpanded ? '' : ` ${style.commentClamp}`}`}
          >
            {review.comment}
          </Text>
          {isCommentTruncated && !isCommentExpanded && (
            <button type='button' className={style.readMore} onClick={() => setIsCommentExpanded(true)}>
              顯示較多
            </button>
          )}
          {isCommentExpanded && (
            <button type='button' className={style.readMore} onClick={() => setIsCommentExpanded(false)}>
              顯示較少
            </button>
          )}
        </div>
      </Card.Section>

      <Card.Section className={style.cardSection}>
        <div className={style.reactionBar}>
          <button
            type='button'
            className={`${style.commentIconButton}${isCommentsOpen ? ` ${style.commentIconButtonActive}` : ''}`}
            onClick={() => setIsCommentsOpen((prev) => !prev)}
            aria-label='切換留言區'
          >
            <FiMessageCircle size={16} />
            <span>{commentCount}</span>
          </button>

          {sortedReactionKeys.map((key) => {
            const preset = presetByKey.get(key)
            const isMine = myReactionSet.has(key)
            const count = reactionSummary.counts[key] ?? 0
            return (
              <button
                key={key}
                type='button'
                className={`${style.reactionChip}${isMine ? ` ${style.reactionChipActive}` : ''}`}
                onClick={() => handleToggleReaction(key)}
                disabled={!user || isTogglingReaction}
              >
                {preset?.type === 'image' && preset.imagePath ? (
                  <img src={getStaticAssetSrc(preset.imagePath) ?? undefined} alt={preset.label} className={style.reactionImage} />
                ) : (
                  <span className={style.reactionEmoji}>{getReactionDisplay(preset, key)}</span>
                )}
                <span className={style.reactionCount}>{count}</span>
              </button>
            )
          })}

          <Menu withinPortal position='bottom-start'>
            <Menu.Target>
              <button
                type='button'
                className={style.reactionAddButton}
                disabled={!user || isTogglingReaction || presets.length === 0}
              >
                +
              </button>
            </Menu.Target>
            <Menu.Dropdown className={style.dropdown}>
              <div className={style.reactionPickerGrid}>
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    type='button'
                    className={style.reactionPickerButton}
                    onClick={() => handleToggleReaction(preset.key)}
                    title={preset.label}
                    aria-label={preset.label}
                    disabled={isTogglingReaction}
                  >
                    {preset.type === 'image' && preset.imagePath ? (
                      <img src={getStaticAssetSrc(preset.imagePath) ?? undefined} alt={preset.label} className={style.reactionImage} />
                    ) : (
                      <span className={style.reactionEmoji}>{getReactionDisplay(preset, preset.key)}</span>
                    )}
                  </button>
                ))}
              </div>
            </Menu.Dropdown>
          </Menu>
        </div>
      </Card.Section>

      {isCommentsOpen && (
        <Card.Section className={style.cardSection}>
          <div className={style.commentsPanel}>
            {isCommentsLoading ? (
              <div className={style.commentsLoading}>
                <Loader size='sm' />
              </div>
            ) : isCommentsError && !comments ? (
              <Text size='sm' c='red'>載入留言失敗，請稍後再試。</Text>
            ) : resolvedComments.length === 0 ? (
              <Text size='sm' c='dimmed'>目前還沒有留言。</Text>
            ) : (
              <div className={style.commentsList}>
                {resolvedComments.map((comment: ReviewComment) => {
                  const isEditing = editingCommentId === comment.id
                  return (
                    <div key={comment.id} className={style.commentRow}>
                      <Avatar
                        variant='light'
                        size='sm'
                        color='brick-red.6'
                        src={getAvatarSrc(comment.UserModel?.avatar ?? null)}
                      />

                      <div className={style.commentBody}>
                        <div className={style.commentItemHeader}>
                          <div>
                            <Text size='sm' fw={600}>{comment.UserModel?.name ?? '匿名'}</Text>
                            <Text size='xs' c='dimmed'>{new Date(comment.updated_at).toLocaleString()}</Text>
                          </div>

                          {comment.is_owner && (
                            <Menu>
                              <Menu.Target>
                                <ActionIcon variant='subtle' size='sm' radius='md' className={style.menuButton}>
                                  <BsThreeDots size={14} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown className={style.dropdown}>
                                <Menu.Item
                                  leftSection={<FaEdit size={14} />}
                                  classNames={{ itemLabel: style.itemLabel }}
                                  onClick={() => startEditComment(comment)}
                                >
                                  編輯
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<RiDeleteBin6Fill size={14} />}
                                  classNames={{ itemLabel: style.itemLabel }}
                                  color='red'
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={isDeletingComment}
                                >
                                  刪除
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          )}
                        </div>

                        {isEditing ? (
                          <div className={style.commentEditBox}>
                            <Textarea
                              value={editingContent}
                              onChange={(event) => {
                                setEditingContent(event.currentTarget.value)
                                if (editingError) setEditingError('')
                              }}
                              minRows={1}
                              maxRows={4}
                              autosize
                              maxLength={500}
                            />
                            <div className={style.commentEditActions}>
                              <Button size='compact-xs' variant='subtle' onClick={cancelEditComment}>
                                取消
                              </Button>
                              <Button
                                size='compact-xs'
                                onClick={() => saveEditComment(comment.id)}
                                loading={isUpdatingComment}
                              >
                                儲存
                              </Button>
                            </div>
                            {editingError && <Text size='xs' c='red'>{editingError}</Text>}
                          </div>
                        ) : (
                          <Text size='sm' className={style.commentItemContent}>{comment.content}</Text>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className={style.commentComposerRow}>
              <Avatar
                variant='light'
                size='sm'
                color='brick-red.6'
                src={getAvatarSrc(user?.avatar ?? null)}
              />
              <div className={style.commentComposerMain}>
                <Textarea
                  value={commentInput}
                  onChange={(event) => {
                    setCommentInput(event.currentTarget.value)
                    if (commentError) setCommentError('')
                  }}
                  placeholder={user ? '輸入留言...' : '請先登入'}
                  minRows={1}
                  maxRows={3}
                  autosize
                  maxLength={500}
                  disabled={!user || isCreatingComment}
                  className={style.commentComposerTextarea}
                />
                <ActionIcon
                  variant='light'
                  color='brick-red.6'
                  onClick={handleSubmitComment}
                  disabled={!user || isCreatingComment}
                  loading={isCreatingComment}
                  aria-label='送出留言'
                >
                  {user ? <FiSend size={16} /> : <FiLock size={16} />}
                </ActionIcon>
              </div>
            </div>
            {commentError && <Text size='xs' c='red'>{commentError}</Text>}
          </div>
        </Card.Section>
      )}
    </Card>
  )
}

export default ReviewCard
