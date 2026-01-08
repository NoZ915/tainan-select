import { FaHeart, FaRegHeart } from "react-icons/fa";

import { useToggleInterest } from "../hooks/interests/useToggleInterest";
import { useAuthStore } from "../stores/authStore";

import { Course } from "../types/courseType";

import styles from "../styles/components/InterestButton.module.css";
import { Button, Text } from "@mantine/core";

interface InterestButtonProps {
	course: { course: Course, hasUserAddInterest: boolean } | null | undefined;
}

const InterestButton: React.FC<InterestButtonProps> = ({ course }) => {
	const { isAuthenticated } = useAuthStore();
	const { mutate: toggleInterest } = useToggleInterest();

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
					? <FaHeart size={20} />
					: <FaRegHeart size={20} />
			}
			variant={course?.hasUserAddInterest ? "filled" : "outline"}
			size="lg"
			disabled={!isAuthenticated}
			className={styles.button}
		>
			<Text>
				{course?.hasUserAddInterest ? "取消收藏" : "加入收藏"}
			</Text>
		</Button>
	)
}

export default InterestButton;