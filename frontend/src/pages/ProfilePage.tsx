import { useState } from 'react'

import { Container } from '@mantine/core'
import styles from '../styles/pages/ProfilePage.module.css'

import { useAuthStore } from '../stores/authStore'

import ProfileLayout from '../components/ProfileLayout'

import SettingsSection from '../components/ProfileLayoutSection/SettingsSection'
import InterestsSection from '../components/ProfileLayoutSection/InterestsSection'
import ReviewsSection from '../components/ProfileLayoutSection/ReviewsSection'

const ProfilePage: React.FC = () => {
	const { user } = useAuthStore()
	const [currentTab, setCurrentTab] = useState('settings')

	return (
		<Container className={styles.container}>
			<ProfileLayout currentTab={currentTab} onTabChange={setCurrentTab}>
				{currentTab === 'settings' && <SettingsSection user={user} />}
				{currentTab === 'interests' && <InterestsSection />}
				{currentTab === 'reviews' && <ReviewsSection />}
			</ProfileLayout>
		</Container>
	)
}

export default ProfilePage