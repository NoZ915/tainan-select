import { FaHeart, FaRegHeart } from 'react-icons/fa'

import { useToggleInterest } from '../hooks/interests/useToggleInterest'
import { useAuthStore } from '../stores/authStore'

import { CourseDetailResponse } from '../types/courseType'

import styles from '../styles/components/InterestButton.module.css'
import { Button } from '@mantine/core'

interface InterestButtonProps {
	course: CourseDetailResponse | null | undefined;
}

const InterestButton: React.FC<InterestButtonProps> = ({course}) => {
	const { isAuthenticated } = useAuthStore()
	const { mutate: toggleInterest } = useToggleInterest()

  const handleToggleInterest = () => {
    const courseId = course?.course.id

    if (!courseId) {
      return
    }

    toggleInterest(courseId)
  }

	return (
		<Button
			onClick={handleToggleInterest}
			leftSection={
				course?.hasUserAddInterest
					? <FaHeart size={13} />
					: <FaRegHeart size={13} />
			}
			variant={ course?.hasUserAddInterest ? 'filled': 'outline' }
			size='xs'
			radius='xl'
			disabled={!isAuthenticated}
			className={styles.button}
		>
			{ course?.hasUserAddInterest ? '取消收藏' : '加入收藏' }
		</Button>
	)
}

export default InterestButton
