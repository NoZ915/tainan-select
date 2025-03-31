import { Button, Group, Modal, Rating, Text, Textarea } from "@mantine/core";
import styles from "../styles/components/AddReviewModal.module.css";
import { Course } from "../types/courseType";

interface AddReviewModalProps {
  opened: boolean;
  onClose: () => void;
  course: { course: Course } | null | undefined;
}

const AddReviewModal: React.FC<AddReviewModalProps> = ({ opened, onClose, course }) => {
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
        <Rating color="brick-red.6" size="md" fractions={2}></Rating>

        <Text>甜度</Text>
        <Rating color="brick-red.6" size="md" fractions={2}></Rating>

        <Text>涼度</Text>
        <Rating color="brick-red.6" size="md" fractions={2}></Rating>
      </Group>

      <Text mt="md">評論</Text>
      <Textarea
        placeholder="請在這裡輸入你的評論"
        minRows={5}
        autosize
      />
      <Button fullWidth mt="md" onClick={onClose}>新增評價</Button>
    </Modal>
  )
}

export default AddReviewModal;