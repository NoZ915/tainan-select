import { useState } from "react";

import { Button, Container, Grid, Group, Stack, Text, TextInput } from "@mantine/core";
import { IoDice } from "react-icons/io5";
import styles from "../styles/components/Profile.module.css";

import { generateTainanCharacterName } from "../utils/tainanDiceMaster";
import { useAuthStore } from "../stores/authStore";
import { useGetAllInterests } from "../hooks/interests/useGetAllInterests";
import { useUpdateUser } from "../hooks/users/useUpdateUser";

import CourseCard from "../components/CourseCard";
import ConfirmModal from "../components/ConfirmModal";

const ProfilePage: React.FC = () => {
	const { user } = useAuthStore();

	const [name, setName] = useState(user?.name ?? "");
	const { mutate: updateUser, isPending } = useUpdateUser();

	const [updateUserModalOpen, setUpdateUserModalOpen] = useState(false);

	// 個人資料
	const handleGenerateName = () => {
		const generatedName = generateTainanCharacterName();
		setName(generatedName);
	};
	const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	}
	const handleSave = (name: string) => {
		updateUser(name);
		setUpdateUserModalOpen(false);
	};

	// 個人收藏
	const { data: allInterests } = useGetAllInterests();

	return (
		<Container className={styles.container}>
			<Stack gap="xs">
				<Text className={styles.title}>個人設定</Text>

				{/* 暱稱設定區塊 */}
				<Stack gap="xs">
					<Text className={styles.itemTitle}>暱稱</Text>

					<Group gap="xs" align="center">
						<TextInput
							value={name}
							onChange={handleNameChange}
							className={styles.textInput}
							w="100%"
						/>
						<Button onClick={handleGenerateName} variant="light">
							<IoDice className={styles.diceButton} />
						</Button>
					</Group>

					<Group>
						<Text size="sm" c={name.length > 10 ? "red" : "black"}>
							{name.length} / 10
						</Text>
						<Text size="sm">
							{name.length > 10 ? "暱稱不可超過10個字" : "該名稱將顯示於評價上，請謹慎使用名稱"}
						</Text>
					</Group>
				</Stack>

				<Button fullWidth onClick={() => setUpdateUserModalOpen(true)} >
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

			<ConfirmModal
				opened={updateUserModalOpen}
				onClose={() => setUpdateUserModalOpen(false)}
				title="更新個人資料"
				message="確定要更新個人資料嗎？按下確認後，將立即更新資料，且不會保留舊有資料"
				confirmText="確認"
				cancelText="取消"
				onConfirm={() => handleSave(name)}
				loading={isPending}
			/>
		</Container>
	);
}

export default ProfilePage;