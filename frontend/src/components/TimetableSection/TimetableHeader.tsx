import { Badge, Group, Select, Text } from '@mantine/core'
import styles from '../../styles/components/Timetable.module.css'

type SemesterOption = {
  value: string
  label: string
}

type TimetableHeaderProps = {
  semesterOptions: SemesterOption[]
  selectedSemester: string | null
  onSemesterChange: (value: string | null) => void
  isDisabled: boolean
  itemsCount: number
  selectableCount: number
  missingTimeslotCount: number
  ewantCount: number
}

const TimetableHeader: React.FC<TimetableHeaderProps> = ({
  semesterOptions,
  selectedSemester,
  onSemesterChange,
  isDisabled,
  itemsCount,
  selectableCount,
  missingTimeslotCount,
  ewantCount,
}) => {
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Text fw={700}>學期課表</Text>
          <Text c='dimmed' size='sm'>
            課表只顯示選定學期，並限制只能加入同學期的收藏課程。
          </Text>
        </div>
        <Group align='center' gap='sm'>
          <Text size='sm' fw={600}>排課學期</Text>
          <Select
            className={styles.semesterSelect}
            placeholder='選擇學期'
            data={semesterOptions}
            value={selectedSemester}
            onChange={onSemesterChange}
            allowDeselect={false}
            disabled={isDisabled}
            aria-label='排課學期'
          />
        </Group>
      </div>

      <Group mt='sm' gap='xs'>
        <Badge variant='light' color='red'>
          已排課程 {itemsCount}
        </Badge>
        <Badge variant='light' color='green'>
          可加入收藏課 {selectableCount}
        </Badge>
        <Badge variant='light' color={missingTimeslotCount > 0 ? 'orange' : 'gray'}>
          缺時段課程 {missingTimeslotCount}
        </Badge>
        <Badge variant='light' color={ewantCount > 0 ? 'blue' : 'gray'}>
          遠距課程 {ewantCount}
        </Badge>
      </Group>
    </>
  )
}

export default TimetableHeader
