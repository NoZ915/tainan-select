import { useMemo } from 'react'

import { Button, Container, Group, Loader, SimpleGrid, Text } from '@mantine/core'
import styles from '../../styles/components/ProfileLayoutSection/InterestsSection.module.css'

import { useGetAllInterests } from '../../hooks/interests/useGetAllInterests'
import CourseCard from '../CourseCard'

const InterestsSection: React.FC = () => {
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
	} = useGetAllInterests()

	const interests = useMemo(() => data?.pages?.flatMap((page) => page.items) ?? [], [data])

	return (
		<Container className={styles.container}>
			{isLoading ? (
				<Group justify='center'>
					<Loader />
				</Group>
			) : interests.length === 0 ? (
				<Text c='dimmed' ta='center' mt='md'>
					尚無收藏
				</Text>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md' verticalSpacing='md'>
					{interests.map((interest) => (
						<div key={interest.id} className={styles.cardItem}>
							<CourseCard course={interest.course} />
						</div>
					))}
				</SimpleGrid>
			)}

			{hasNextPage && (
				<Group justify='center' mt='lg'>
					<Button variant='light' onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
						載入更多
					</Button>
				</Group>
			)}
		</Container>
	)
}

export default InterestsSection
