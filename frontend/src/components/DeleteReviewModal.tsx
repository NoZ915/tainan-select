import { Button, Group, Modal, Text } from "@mantine/core";
import { ReviewsResponse } from "../types/reviewType";
import { useDeleteReview } from "../hooks/reviews/useDeleteReview";

interface DeleteReviewModalProps {
  opened: boolean;
  onClose: () => void;
  review: ReviewsResponse | null;
}

const DeleteReviewModal: React.FC<DeleteReviewModalProps> = ({ opened, onClose, review }) => {
  const { mutate } = useDeleteReview();
  const handleDelete = () => {
    if (review) {
      mutate(review.id);
    }
    onClose();
  }


  return (
    <Modal centered opened={opened} onClose={onClose} title="刪除評論" zIndex={1100}>
      <Text>確定要刪除評論嗎？一經刪除將無法復原。</Text>
      <Group justify="flex-end" mt="md">
        <Button variant="light" onClick={onClose}>取消</Button>
        <Button variant="filled" onClick={() => handleDelete()}>刪除</Button>
      </Group>
    </Modal>
  )
}

export default DeleteReviewModal;