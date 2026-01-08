import { useEffect, useState } from 'react'

import { Button, Group, Modal, Rating, Text, Textarea } from '@mantine/core'
import styles from '../styles/components/AddOrEditReviewModal.module.css'

import { Course } from '../types/courseType'
import { ReviewsResponse } from '../types/reviewType'

import { useUpsertReview } from '../hooks/reviews/useUpsertRview'
import ConfirmModal from './ConfirmModal'

interface AddOrEditReviewModalProps {
  opened: boolean;
  onClose: () => void;
  course: { course: Course };
  review: ReviewsResponse | null
}

const AddOrEditReviewModal: React.FC<AddOrEditReviewModalProps> = ({ opened, onClose, course, review }) => {
  const [gain, setGain] = useState(review?.gain ?? 0)
  const [sweetness, setSweetness] = useState(review?.sweetness ?? 0)
  const [coolness, setCoolness] = useState(review?.coolness ?? 0)
  const [comment, setComment] = useState(review?.comment ?? '')

  const [scoreWarningModalOpen, setScroreWarningModalOpen] = useState(false)
  const [commentWarningModalOpen, setCommentWarningModalOpen] = useState(false)

  const { mutate, isPending } = useUpsertReview()

  useEffect(() => {
    if (review) {
      setGain(review.gain ?? 0)
      setSweetness(review.sweetness ?? 0)
      setCoolness(review.coolness ?? 0)
      setComment(review.comment ?? '')
    }
  }, [review])

  const isZero = (value: number) => Math.abs(value) < 0.001
  const handleCheckReview = (course_id: number) => {
    if (comment.trim() === '') {
      setCommentWarningModalOpen(true)
      return
    }

    if (isZero(gain) || isZero(sweetness) || isZero(coolness)) {
      setScroreWarningModalOpen(true)
    } else {
      handleUpsertReview(course_id)
    }
  }

  const handleUpsertReview = (course_id: number) => {
    mutate({
      course_id,
      gain,
      sweetness,
      coolness,
      comment
    })

    setScroreWarningModalOpen(false)
    onClose()
  }

  return (
    <Modal
      centered
      closeOnClickOutside={false}
      opened={opened}
      onClose={onClose}
      title={course?.course.course_name}
      size='lg'
      className={styles.modal}
      zIndex={1100}
    >
      <Group>
        <Text>收穫</Text>
        <Rating color='brick-red.6' size='md' fractions={2} onChange={(g) => setGain(g)} value={gain}></Rating>

        <Text>甜度</Text>
        <Rating color='brick-red.6' size='md' fractions={2} onChange={(s) => setSweetness(s)} value={sweetness}></Rating>

        <Text>涼度</Text>
        <Rating color='brick-red.6' size='md' fractions={2} onChange={(c) => setCoolness(c)} value={coolness}></Rating>
      </Group>

      <Text mt='md'>評論</Text>
      <Textarea
        placeholder='請在這裡輸入你的評論'
        minRows={5}
        autosize
        value={comment}
        onChange={(c) => setComment(c.currentTarget.value)}
      />

      {review ? (
        <Button fullWidth mt='md' onClick={() => handleCheckReview(course.course.id)}>編輯評價</Button>
      ) : (
        <Button fullWidth mt='md' onClick={() => handleCheckReview(course.course.id)}>新增評價</Button>
      )}

      <ConfirmModal
        opened={scoreWarningModalOpen}
        onClose={() => setScroreWarningModalOpen(false)}
        title='確認送出評價'
        message='您給予的評分中包含 0 分，請確認是否為忘記填寫。如果不是填寫疏漏，請按下『送出評價』；若需修改，請按下『返回』返回補填。'
        confirmText='送出評價'
        cancelText='返回'
        loading={isPending}
        onConfirm={() => handleUpsertReview(course.course.id)}
      />
      <ConfirmModal
        opened={commentWarningModalOpen}
        onClose={() => setCommentWarningModalOpen(false)}
        title='評論不可為空'
        message='請輸入評論內容後再送出。'
        confirmText='我知道了'
        onConfirm={() => setCommentWarningModalOpen(false)}
      />

    </Modal>
  )
}

export default AddOrEditReviewModal