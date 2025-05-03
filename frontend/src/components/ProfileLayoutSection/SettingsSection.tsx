import { useState } from "react";

import { generateTainanCharacterName } from "../../utils/tainanDiceMaster";
import { User } from "../../types/userType";

import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { IoDice } from "react-icons/io5";
import styles from "../../styles/components/ProfileLayoutSection/SettingsSection.module.css";
import ConfirmModal from "../ConfirmModal";
import { useUpdateUser } from "../../hooks/users/useUpdateUser";

interface SettingsSectionProps{
	user: User | null
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ user }) => {
	const [name, setName] = useState(user?.name ?? "");
	const [updateUserModalOpen, setUpdateUserModalOpen] = useState(false);
	const { mutate: updateUser, isPending } = useUpdateUser();


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

	return (
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
		</Stack>
	)
}

export default SettingsSection;