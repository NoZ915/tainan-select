import { Badge, Button, Group, Select, Text } from '@mantine/core'
import { FaChevronDown, FaChevronUp, FaSearch, FaTrashAlt } from 'react-icons/fa'
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
  isGuest: boolean
  itemsCount: number
  missingTimeslotCount: number
  ewantCount: number
  collapsed: boolean
  onToggleCollapse: () => void
  onClearGuestSemester: () => void
  onOpenCourseSearch: () => void
}

const TimetableHeader: React.FC<TimetableHeaderProps> = ({
  semesterOptions,
  selectedSemester,
  onSemesterChange,
  isDisabled,
  isGuest,
  itemsCount,
  missingTimeslotCount,
  ewantCount,
  collapsed,
  onToggleCollapse,
  onClearGuestSemester,
  onOpenCourseSearch,
}) => {
  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Group gap='xs' align='center'>
            <Text fw={700}>學期課表</Text>
            <Button
              variant='subtle'
              color='gray'
              size='xs'
              onClick={onToggleCollapse}
              aria-label={collapsed ? '展開課程清單' : '收合課程清單'}
              rightSection={collapsed ? <FaChevronDown size={11} /> : <FaChevronUp size={11} />}
            >
              {collapsed ? '展開課程明細' : '收合課程明細'}
            </Button>
          </Group>
          <Text c='dimmed' size='sm'>
            {isGuest
              ? '課表只顯示選定學期，可直接搜尋課程加入。'
              : '課表與收藏互不影響，可直接搜尋課程加入。'}
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
          <Button
            variant='light'
            leftSection={<FaSearch size={13} />}
            disabled={!selectedSemester || isDisabled}
            onClick={onOpenCourseSearch}
          >
            搜尋加入課程
          </Button>
          {isGuest && (
            <Button
              variant='light'
              color='red'
              leftSection={<FaTrashAlt size={13} />}
              disabled={!selectedSemester || itemsCount === 0}
              onClick={onClearGuestSemester}
            >
              清空課表
            </Button>
          )}
        </Group>
      </div>

      <Group mt='sm' gap='xs'>
        <Badge variant='light' color='red'>
          已排課程 {itemsCount}
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
