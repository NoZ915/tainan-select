import { useEffect, useMemo, useState } from 'react'
import { ActionIcon, Avatar, Button, Card, Container, Grid, Group, Loader, Modal, SimpleGrid, Tabs, Text, TextInput } from '@mantine/core'
import { FaPencilAlt } from 'react-icons/fa'
import { IoDice } from 'react-icons/io5'

import styles from '../styles/pages/ProfilePage.module.css'
import { useAuthStore } from '../stores/authStore'
import CourseCard from '../components/CourseCard'
import ReviewCard from '../components/ReviewCard'
import { useGetAllReviewsByUserId } from '../hooks/reviews/useGetAllReviewsByUserId'
import { useGetAllInterests } from '../hooks/interests/useGetAllInterests'
import { useUpdateUser } from '../hooks/users/useUpdateUser'
import { generateTainanCharacterName } from '../utils/tainanDiceMaster'
import { DISPLAY_NAME_HELPER_TEXT, DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../utils/displayName'

const ProfilePage: React.FC = () => {
	const { user } = useAuthStore()
	const [currentTab, setCurrentTab] = useState('reviews')
	const [displayName, setDisplayName] = useState(user?.name ?? 'User')
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [draftName, setDraftName] = useState(displayName)
	const [saveError, setSaveError] = useState<string | null>(null)
	const { mutateAsync: updateUser, isPending: isUpdating } = useUpdateUser()

	const {
		data: reviewData,
		fetchNextPage: fetchMoreReviews,
		hasNextPage: hasMoreReviews,
		isFetchingNextPage: isFetchingMoreReviews,
		isLoading: isReviewsLoading,
	} = useGetAllReviewsByUserId()

	const {
		data: interestData,
		fetchNextPage: fetchMoreFavorites,
		hasNextPage: hasMoreFavorites,
		isFetchingNextPage: isFetchingMoreFavorites,
		isLoading: isFavoritesLoading,
	} = useGetAllInterests()

	const userReviews = useMemo(() => reviewData?.pages?.flatMap((page) => page.items) ?? [], [reviewData])
	const favoriteCourses = useMemo(() => interestData?.pages?.flatMap((page) => page.items) ?? [], [interestData])
	const favoritesCount = interestData?.pages?.[0]?.count ?? favoriteCourses.length
	const reviewsCount = reviewData?.pages?.[0]?.count ?? userReviews.length

	const handleOpenEdit = () => {
		setDraftName(displayName)
		setSaveError(null)
		setIsEditOpen(true)
	}

	const handleSave = async () => {
		const errorMessage = validateDisplayName(draftName)
		if (errorMessage) {
			setSaveError(errorMessage)
			return
		}
		setSaveError(null)
		try {
			await updateUser(draftName.trim())
			setIsEditOpen(false)
		} catch (error) {
			const message = error instanceof Error ? error.message : '更新名稱失敗'
			setSaveError(message)
		}
	}

	const handleGenerateName = () => {
		setDraftName(generateTainanCharacterName())
		setSaveError(null)
	}

	useEffect(() => {
		setDisplayName(user?.name ?? 'User')
	}, [user?.name])

	return (
		<Container className={styles.container}>
			<Card className={styles.headerCard}>
				<div className={styles.headerTop}>
					<Avatar
						size='lg'
						radius='xl'
						variant='light'
						color='brick-red.6'
						src=''
						className={styles.avatar}
					/>
					<div className={styles.headerContent}>
						<div className={styles.nameRow}>
							<Text className={styles.displayName}>{displayName || 'Your name'}</Text>
							<ActionIcon
								variant='light'
								color='brick-red.6'
								aria-label='Edit name'
								onClick={handleOpenEdit}
							>
								<FaPencilAlt size={14} />
							</ActionIcon>
						</div>
						<div className={styles.statsRow}>
							<div className={styles.statItem}>
								<Text className={styles.statValue}>{reviewsCount}</Text>
								<Text className={styles.statLabel}>評價數</Text>
							</div>
							<div className={styles.statDivider} />
							<div className={styles.statItem}>
								<Text className={styles.statValue}>{favoritesCount}</Text>
								<Text className={styles.statLabel}>收藏數</Text>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<Card className={styles.contentCard}>
				<Tabs value={currentTab} onChange={(value) => setCurrentTab(value ?? 'reviews')} keepMounted={false}>
					<Tabs.List className={styles.tabsList}>
						<Tabs.Tab value='reviews'>個人評價</Tabs.Tab>
						<Tabs.Tab value='favorites'>個人收藏</Tabs.Tab>
					</Tabs.List>

					<Tabs.Panel value='reviews' pt='lg'>
						{isReviewsLoading ? (
							<Group justify='center'>
								<Loader />
							</Group>
						) : userReviews.length === 0 ? (
							<Text c='dimmed' ta='center'>
								尚無評價
							</Text>
						) : (
							<Grid gutter='md'>
								{userReviews.map((review) => (
									<Grid.Col key={review.id} span={{ base: 12, md: 6 }}>
										<ReviewCard review={review} course={{ course: review.course }} />
									</Grid.Col>
								))}
							</Grid>
						)}
						{hasMoreReviews && (
							<Group justify='center' mt='lg'>
								<Button
									variant='light'
									onClick={() => fetchMoreReviews()}
									loading={isFetchingMoreReviews}
								>
									載入更多
								</Button>
							</Group>
						)}
					</Tabs.Panel>

					<Tabs.Panel value='favorites' pt='lg'>
						{isFavoritesLoading ? (
							<Group justify='center'>
								<Loader />
							</Group>
						) : favoriteCourses.length === 0 ? (
							<Text c='dimmed' ta='center'>
								尚無收藏
							</Text>
						) : (
							<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='md' verticalSpacing='md'>
								{favoriteCourses.map((interest) => (
									<div key={interest.id} className={styles.favoriteCardItem}>
										<CourseCard course={interest.course} />
									</div>
								))}
							</SimpleGrid>
						)}
						{hasMoreFavorites && (
							<Group justify='center' mt='lg'>
								<Button
									variant='light'
									onClick={() => fetchMoreFavorites()}
									loading={isFetchingMoreFavorites}
								>
									載入更多
								</Button>
							</Group>
						)}
					</Tabs.Panel>
				</Tabs>
			</Card>

			<Modal
				opened={isEditOpen}
				onClose={() => setIsEditOpen(false)}
				title='更新個人名稱'
				centered
				zIndex={1100}
				size='lg'
				className={styles.editModal}
			>
				<TextInput
					label='顯示名稱'
					value={draftName}
					onChange={(event) => setDraftName(event.currentTarget.value)}
					error={saveError ?? undefined}
					placeholder='請輸入名稱'
					rightSection={
						<ActionIcon variant='light' onClick={handleGenerateName} aria-label='Random name'>
							<IoDice size={16} />
						</ActionIcon>
					}
					rightSectionWidth={42}
				/>
				<Group justify='space-between' mt='xs'>
					<Text size='sm' c={draftName.length > DISPLAY_NAME_MAX_LENGTH ? 'red' : 'dimmed'}>
						{draftName.length} / {DISPLAY_NAME_MAX_LENGTH}
					</Text>
					<Text size='sm' c='dimmed'>
						{DISPLAY_NAME_HELPER_TEXT}
					</Text>
				</Group>
				<Button fullWidth mt='md' onClick={handleSave} loading={isUpdating}>
					儲存
				</Button>
			</Modal>
		</Container>
	)
}

export default ProfilePage
