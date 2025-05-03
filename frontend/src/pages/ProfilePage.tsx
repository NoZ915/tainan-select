import { useState } from "react";

import { Container, Grid, Text } from "@mantine/core";
import styles from "../styles/components/Profile.module.css";

import { useAuthStore } from "../stores/authStore";
import { useGetAllInterests } from "../hooks/interests/useGetAllInterests";

import CourseCard from "../components/CourseCard";
import ProfileLayout from "../components/ProfileLayout";

import SettingsSection from "../components/ProfileLayoutSection/SettingsSection";
import InterestsSection from "../components/ProfileLayoutSection/InterestsSection";
import ReviewsSection from "../components/ProfileLayoutSection/ReviewsSection";

const ProfilePage: React.FC = () => {
	const { user } = useAuthStore();
	const [currentTab, setCurrentTab] = useState("settings");

	// 個人收藏
	const { data: allInterests } = useGetAllInterests();

	return (
		<Container className={styles.container}>
			<ProfileLayout currentTab={currentTab} onTabChange={setCurrentTab}>
				{currentTab === "settings" && <SettingsSection user={user} />}
				{currentTab === "favorites" && <InterestsSection />}
				{currentTab === "reviews" && <ReviewsSection />}
			</ProfileLayout>

			

			<Container mt="md">
				<Text className={styles.title}>個人收藏</Text>
				<div className={styles.interests}>
					<Grid gutter="md" className={styles.grid}>
						{allInterests?.map((interest) => {
							return (
								<Grid.Col key={interest.id} span={{ base: 12 }}>
									<CourseCard course={interest.course} />
								</Grid.Col>
							)
						})}
					</Grid>
				</div>
			</Container>


		</Container>
	);
}

export default ProfilePage;