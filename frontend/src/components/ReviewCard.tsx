import { useState } from 'react'

import { Link } from 'react-router-dom'
import { ActionIcon, Avatar, Box, Card, Group, Menu, Rating, Text } from '@mantine/core'
import { BsThreeDots } from 'react-icons/bs'
import { FaEdit } from 'react-icons/fa'
import { RiDeleteBin6Fill } from 'react-icons/ri'
import style from '../styles/components/ReviewCard.module.css'

import { ReviewsResponse } from '../types/reviewType'
import { Course } from '../types/courseType'

import AddOrEditReviewModal from './AddOrEditReviewModal'
import ConfirmModal from './ConfirmModal'
import { useDeleteReview } from '../hooks/reviews/useDeleteReview'

interface ReviewCardProp {
	review: ReviewsResponse,
	course: { course: Course } | null | undefined;
}

const ReviewCard: React.FC<ReviewCardProp> = ({ review, course }) => {
	const [AddOrEditReviewModalOpened, setAddOrEditReviewModalOpened] = useState(false)
	const [DeleteReviewModalOpened, setDeleteReviewModalOpened] = useState(false)
	const [selectedReview, setSelectedReview] = useState<ReviewsResponse | null>(null)

	const handleEdit = (review: ReviewsResponse) => {
		setAddOrEditReviewModalOpened(true)
		setSelectedReview(review)
	}

	const { mutate, isPending } = useDeleteReview()
	const handleConfirmDelete = (review: ReviewsResponse) => {
		if (review) {
			mutate(review.id)
		}
		setDeleteReviewModalOpened(false)
	}

	const handleDeleteModal = (review: ReviewsResponse) => {
		setDeleteReviewModalOpened(true)
		setSelectedReview(review)
	}

	return (
		<Card className={style.card}>
			<Card.Section className={style.cardSection}>
				<Group justify='space-between'>
					<Group>
						<Avatar variant='light' size='lg' color='brick-red.6' src='' />
						<Box>
							<Text>{review.UserModel.name}</Text>
							<Text size='xs' c='dimmed'>{new Date(review.updated_at).toLocaleString()}</Text>
						</Box>
					</Group>
					{review.is_owner && (
						<Menu>
							<Menu.Target>
								<ActionIcon variant='fullfill' size='lg' radius='xs'>
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
					<AddOrEditReviewModal opened={AddOrEditReviewModalOpened} onClose={() => setAddOrEditReviewModalOpened(false)} course={course} review={selectedReview} />
				}
				{course &&
					<ConfirmModal
						opened={DeleteReviewModalOpened}
						onClose={() => setDeleteReviewModalOpened(false)}
						title='刪除評論'
						message='確定要刪除評論嗎？一經刪除將無法復原。'
						confirmText='刪除'
						cancelText='取消'
						loading={isPending}
						onConfirm={() => handleConfirmDelete(review)}
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
				<Group>
					<Text>收穫</Text>
					<Rating value={review.gain} color='brick-red.6' size='md' fractions={2} readOnly></Rating>

					<Text>甜度</Text>
					<Rating value={review.sweetness} color='brick-red.6' size='md' fractions={2} readOnly></Rating>

					<Text>涼度</Text>
					<Rating value={review.coolness} color='brick-red.6' size='md' fractions={2} readOnly></Rating>
				</Group>
			</Card.Section>

			<Card.Section className={style.cardSection}>
				<Text className={style.commentText}>{review.comment}</Text>
			</Card.Section>
		</Card>
	)
}

export default ReviewCard
