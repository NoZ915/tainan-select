import { Button, Group, Modal, Text } from '@mantine/core'

interface DeleteReviewModalProps {
  opened: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<DeleteReviewModalProps> = ({ 
  opened,
  onClose,
  title = '確認動作',
  message = '確定要執行此動作嗎？',
  confirmText = '確認',
  cancelText,
  onConfirm,
  loading = false,
}) => {

  return (
    <Modal centered opened={opened} onClose={onClose} title={title} zIndex={1100}>
      <Text>{message}</Text>
      <Group justify='flex-end' mt='md'>
        {cancelText && 
        <Button variant='light' onClick={onClose}>
          {cancelText}
        </Button>}
        <Button variant='filled' color='red' onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </Group>
    </Modal>
  )
}

export default ConfirmModal