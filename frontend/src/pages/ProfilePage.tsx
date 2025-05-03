import { useState } from "react";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";
import { Button, Container, Grid, Group, Stack, Text, TextInput } from "@mantine/core";
import styles from "../styles/components/Profile.module.css";
import { IoDice } from "react-icons/io5";
import { useAuthStore } from "../stores/authStore";
import { useGetAllInterests } from "../hooks/interests/useGetAllInterests";
import CourseCard from "../components/CourseCard";
import { useUpdateUser } from "../hooks/users/useUpdateUser";

const ProfilePage: React.FC = () => {
	const { user } = useAuthStore();
	const [name, setName] = useState(user?.name ?? "");
	const { mutate: updateUser } = useUpdateUser();

	// 個人資料
	const handleGenerateName = () => {
		const generatedName = generateTainanCharacterName();
		setName(generatedName);
	};

	const handleSave = (name: string) => {
		updateUser(name);
	};

	// 個人收藏
	const { data: allInterests } = useGetAllInterests();

	return (
		<Container className={styles.container}>
			<Stack gap="xs">
				<Text className={styles.title}>個人設定</Text>

				<Group>
					<Text className={styles.itemTitle}>暱稱</Text>
					<TextInput
						value={name}
						onChange={(e) => setName(e.target.value)}
						className={styles.textInput}
					/>
					<Button onClick={handleGenerateName} >
						<IoDice className={styles.diceButton} />
					</Button>
				</Group>
				<Text>該名稱將顯示於評價上，請謹慎使用名稱</Text>

				<Button
					fullWidth
					onClick={() => handleSave(name)}
				>
					儲存
				</Button>
			</Stack>

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