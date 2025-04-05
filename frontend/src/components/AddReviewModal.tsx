import { Button, Group, Modal, Rating, Text, Textarea } from "@mantine/core";
import styles from "../styles/components/AddReviewModal.module.css";
import { Course } from "../types/courseType";
import { useCreateReview } from "../hooks/reviews/useCreateRview";
import { useState } from "react";

interface AddReviewModalProps {
  opened: boolean;
  onClose: () => void;
  course: { course: Course };
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ opened, onClose, course }) => {
  const [gain, setGain] = useState(0);
  const [sweetness, setSweetness] = useState(0);
  const [coolness, setCoolness] = useState(0);
  const [comment, setComment] = useState("");

  const { mutate } = useCreateReview();

  const handleCreateReview = (course_id: number) => {
    mutate({
      course_id,
      gain,
      sweetness,
      coolness,
      comment
    });
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
      <Button fullWidth mt="md" onClick={() => handleCreateReview(course.course.id)}>新增評價</Button>
    </Modal>
  )
}

export default AddReviewModal;