import { useEffect, useState } from "react";

import { Button, Group, Modal, Rating, Text, Textarea } from "@mantine/core";
import styles from "../styles/components/AddOrEditReviewModal.module.css";

import { Course } from "../types/courseType";
import { ReviewsResponse } from "../types/reviewType";

import { useUpsertReview } from "../hooks/reviews/useUpsertRview";

interface AddOrEditReviewModalProps {
  opened: boolean;
  onClose: () => void;
  course: { course: Course };
  review: ReviewsResponse | null
}

const AddOrEditReviewModal: React.FC<AddOrEditReviewModalProps> = ({ opened, onClose, course, review }) => {
  const [gain, setGain] = useState(review?.gain ?? 0);
  const [sweetness, setSweetness] = useState(review?.sweetness ?? 0);
  const [coolness, setCoolness] = useState(review?.coolness ?? 0);
  const [comment, setComment] = useState(review?.comment ?? "");

  const { mutate } = useUpsertReview();

  useEffect(() => {
    if (review) {
      setGain(review.gain ?? 0);
      setSweetness(review.sweetness ?? 0);
      setCoolness(review.coolness ?? 0);
      setComment(review.comment ?? "");
    }
  }, [review]);

  const handleUpsertReview = (course_id: number) => {
    mutate({
      course_id,
      gain,
      sweetness,
      coolness,
      comment
    });
    setGain(0);
    setSweetness(0);
    setCoolness(0);
    setComment("");
    onClose();
  }

  return (
    <Modal
      centered
      closeOnClickOutside={false}
      opened={opened}
      onClose={onClose}
      title={course?.course.course_name}
      size="lg"
      className={styles.modal}
      zIndex={1100}
    >
      <Group>
        <Text>收穫</Text>
        <Rating color="brick-red.6" size="md" fractions={2} onChange={(g) => setGain(g)} value={gain}></Rating>

        <Text>甜度</Text>
        <Rating color="brick-red.6" size="md" fractions={2} onChange={(s) => setSweetness(s)} value={sweetness}></Rating>

        <Text>涼度</Text>
        <Rating color="brick-red.6" size="md" fractions={2} onChange={(c) => setCoolness(c)} value={coolness}></Rating>
      </Group>

      <Text mt="md">評論</Text>
      <Textarea
        placeholder="請在這裡輸入你的評論"
        minRows={5}
        autosize
        value={comment}
        onChange={(c) => setComment(c.currentTarget.value)}
      />

      {review ? (
        <Button fullWidth mt="md" onClick={() => handleUpsertReview(course.course.id)}>編輯評價</Button>
      ) : (
        <Button fullWidth mt="md" onClick={() => handleUpsertReview(course.course.id)}>新增評價</Button>
      )}

    </Modal>
  )
}

export default AddOrEditReviewModal;