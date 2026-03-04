import { useEffect, useMemo, useState } from 'react'
import {
  ActionIcon,
  Avatar,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Tabs,
  Text,
  TextInput,
} from '@mantine/core'
import { FaPencilAlt } from 'react-icons/fa'
import { IoDice } from 'react-icons/io5'

import styles from '../styles/pages/ProfilePage.module.css'
import { useAuthStore } from '../stores/authStore'
import CourseCard from '../components/CourseCard'
import ReviewCard from '../components/ReviewCard'
import { useGetAllReviewsByUserId } from '../hooks/reviews/useGetAllReviewsByUserId'
import { useGetAllInterests } from '../hooks/interests/useGetAllInterests'
import { useUpdateUserAvatar, useUpdateUserName } from '../hooks/users/useUpdateUser'
import { generateTainanCharacterName } from '../utils/tainanDiceMaster'
import { DISPLAY_NAME_HELPER_TEXT, DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from '../utils/displayName'
import { AVATAR_OPTIONS } from '../constants/avatars'
import { getAvatarSrc } from '../utils/avatarUrl'

const ProfilePage: React.FC = () => {
  const { user } = useAuthStore()
  const [currentTab, setCurrentTab] = useState('reviews')
  const [displayName, setDisplayName] = useState(user?.name ?? 'User')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [draftName, setDraftName] = useState(displayName)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatar ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const { mutateAsync: updateUserName, isPending: isUpdatingName } = useUpdateUserName()
  const { mutateAsync: updateUserAvatar, isPending: isUpdatingAvatar } = useUpdateUserAvatar()

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

  const handleOpenAvatar = () => {
    setSelectedAvatar(user?.avatar ?? null)
    setAvatarError(null)
    setIsAvatarOpen(true)
  }

  const handleSaveName = async () => {
    const errorMessage = validateDisplayName(draftName)
    if (errorMessage) {
      setSaveError(errorMessage)
      return
    }
    setSaveError(null)
    try {
      await updateUserName({ name: draftName.trim() })
      setIsEditOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新名稱失敗'
      setSaveError(message)
    }
  }

  const handleSaveAvatar = async () => {
    setAvatarError(null)
    try {
      await updateUserAvatar({ avatar: selectedAvatar })
      setIsAvatarOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '更新頭像失敗'
      setAvatarError(message)
    }
  }

  const handleGenerateName = () => {
    setDraftName(generateTainanCharacterName())
    setSaveError(null)
  }

  useEffect(() => {
    setDisplayName(user?.name ?? 'User')
  }, [user?.name])

  const avatarSrc = getAvatarSrc(user?.avatar)

  return (
    <Container className={styles.container}>
      <Card className={styles.headerCard}>
        <div className={styles.headerTop}>
          <div className={styles.avatarWrapper}>
            <Avatar
              size='lg'
              radius='xl'
              variant='light'
              color='brick-red.6'
              src={avatarSrc}
              className={styles.avatar}
            />
            <ActionIcon
              variant='light'
              color='brick-red.6'
              aria-label='Edit avatar'
              onClick={handleOpenAvatar}
              className={styles.avatarEditButton}
            >
              <FaPencilAlt size={12} />
            </ActionIcon>
          </div>
          <div className={styles.headerContent}>
            <div className={styles.nameRow}>
              <Text className={styles.displayName}>{displayName || 'Your name'}</Text>
              <ActionIcon
                variant='light'
                color='brick-red.6'
                aria-label='Edit name'
                onClick={handleOpenEdit}
                className={styles.nameEditButton}
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
                <Button variant='light' onClick={() => fetchMoreReviews()} loading={isFetchingMoreReviews}>
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
                <Button variant='light' onClick={() => fetchMoreFavorites()} loading={isFetchingMoreFavorites}>
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
        <Button fullWidth mt='md' onClick={handleSaveName} loading={isUpdatingName}>
          儲存名稱
        </Button>
      </Modal>

      <Modal
        opened={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        title='更新頭像'
        centered
        zIndex={1100}
        size='lg'
        className={styles.editModal}
      >
        <SimpleGrid
          cols={{ base: 3, sm: 4, md: 4 }}
          spacing='md'
          verticalSpacing='md'
          className={styles.avatarGrid}
        >
          <button
            type='button'
            className={`${styles.avatarOption} ${styles.avatarOptionDefault} ${selectedAvatar === null ? styles.avatarOptionActive : ''}`}
            onClick={() => {
              setSelectedAvatar(null)
              setAvatarError(null)
            }}
          >
            <Avatar size='lg' radius='xl' variant='light' color='brick-red.6' />
          </button>
          {AVATAR_OPTIONS.map((avatar) => {
            const src = getAvatarSrc(avatar)
            const isSelected = avatar === selectedAvatar
            return (
              <button
                key={avatar}
                type='button'
                className={`${styles.avatarOption} ${isSelected ? styles.avatarOptionActive : ''}`}
                onClick={() => {
                  setSelectedAvatar(avatar)
                  setAvatarError(null)
                }}
              >
                <Avatar src={src} size='lg' radius='xl' />
              </button>
            )
          })}
        </SimpleGrid>
        {avatarError && (
          <Text size='sm' c='red' mt='sm'>
            {avatarError}
          </Text>
        )}
        <Button fullWidth mt='md' onClick={handleSaveAvatar} loading={isUpdatingAvatar}>
          儲存頭像
        </Button>
      </Modal>
    </Container>
  )
}

export default ProfilePage
