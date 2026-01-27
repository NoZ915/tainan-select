import { useEffect, useRef, useState } from 'react'

import { Link } from 'react-router-dom'
import { ActionIcon, Avatar, Box, Card, Group, Menu, Rating, Text } from '@mantine/core'
import { BsThreeDots } from 'react-icons/bs'
import { FaEdit } from 'react-icons/fa'
import { RiDeleteBin6Fill } from 'react-icons/ri'
import style from '../styles/components/ReviewCard.module.css'

import { ReviewsResponse } from '../types/reviewType'
import { Course } from '../types/courseType'
import { useAuthStore } from '../stores/authStore'

import AddOrEditReviewModal from './AddOrEditReviewModal'
import ConfirmModal from './ConfirmModal'
import { useDeleteReview } from '../hooks/reviews/useDeleteReview'

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

	const handleEdit = (review: ReviewsResponse) => {
		setIsAddOrEditReviewModalOpen(true)
		setSelectedReview(review)
	}

	const { mutate, isPending } = useDeleteReview()
	const handleConfirmDelete = (review: ReviewsResponse) => {
		if (review) {
      mutate(review.id, {
        onSuccess: () => setIsDeleteReviewModalOpen(false),
      })
		}
	}

	const handleDeleteModal = (review: ReviewsResponse) => {
		setIsDeleteReviewModalOpen(true)
		setSelectedReview(review)
	}

	useEffect(() => {
		setIsCommentExpanded(false)
	}, [review.comment])

	useEffect(() => {
		const el = commentElementRef.current
		if (!el) {
			return
		}

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

  const reviewerName =
    review.is_owner
      ? (user?.name ?? review.UserModel?.name ?? '匿名')
      : (review.UserModel?.name ?? '匿名')


	return (
		<Card className={style.card}>
			<Card.Section className={style.cardSection}>
				<Group justify='space-between' className={style.headerRow}>
					<Group className={style.userInfo}>
						<Avatar variant='light' size='lg' color='brick-red.6' src='' />
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
				{course &&
					<AddOrEditReviewModal opened={isAddOrEditReviewModalOpen} onClose={() => setIsAddOrEditReviewModalOpen(false)} course={course} review={selectedReview} />
				}
				{course &&
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
				}
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
						<Rating value={review.gain} color='brick-red.6' size='md' fractions={2} readOnly></Rating>
					</Group>

					<Group className={style.ratingItem}>
						<Text>甜度</Text>
						<Rating value={review.sweetness} color='brick-red.6' size='md' fractions={2} readOnly></Rating>
					</Group>

					<Group className={style.ratingItem}>
						<Text>涼度</Text>
						<Rating value={review.coolness} color='brick-red.6' size='md' fractions={2} readOnly></Rating>
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
		</Card>
	)
}

export default ReviewCard
