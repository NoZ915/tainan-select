import { Link } from 'react-router-dom'
import { Button, Group, Modal, Stack, Text } from '@mantine/core'
import { TimetableConflict } from '../../types/timetableType'

type SwapTargetCourse = {
  id: number
  name: string
}

type SwapConflictModalProps = {
  opened: boolean
  targetCourse: SwapTargetCourse | null
  conflicts: TimetableConflict[]
  addedCourseNameMap: Map<number, string>
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => void
}

const SwapConflictModal: React.FC<SwapConflictModalProps> = ({
  opened,
  targetCourse,
  conflicts,
  addedCourseNameMap,
  isSubmitting,
  onClose,
  onConfirm,
}) => {
  const conflictCourseIds = Array.from(new Set(conflicts.map((item) => item.conflictWithCourseId)))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title='偵測到衝堂，是否交換課程？'
      centered
      zIndex={1300}
      radius='md'
      padding='lg'
    >
      <Stack gap='xs'>
        <Text size='sm'>
          你要加入「{targetCourse?.name ?? '-'}」時，會和下列已排課程衝堂：
        </Text>
        {conflictCourseIds.map((conflictCourseId) => (
          <Text key={conflictCourseId} size='sm' c='dimmed'>
            -
            {' '}
            <Text component={Link} to={`/course/${conflictCourseId}`} span inherit>
              {addedCourseNameMap.get(conflictCourseId) ?? `課程 ${conflictCourseId}`}
            </Text>
          </Text>
        ))}
        <Text size='sm'>確定要移除衝堂課程並加入新課嗎？</Text>
        <Group justify='flex-end' mt='sm'>
          <Button variant='light' onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button variant='filled' color='red' onClick={onConfirm} loading={isSubmitting}>
            交換課程
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default SwapConflictModal
