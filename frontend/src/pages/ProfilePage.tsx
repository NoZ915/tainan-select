import { useState } from "react";
import { generateTainanCharacterName } from "../utils/tainanDiceMaster";
import { Button, Container, Group, Text, TextInput } from "@mantine/core";
import styles from "../styles/components/Profile.module.css";
import { IoDice } from "react-icons/io5";
import { useAuthStore } from "../stores/authStore";

const ProfilePage: React.FC = () => {
	const { user } = useAuthStore();
	const [name, setName] = useState(user?.name);

	const handleGenerateName = () => {
		const generatedName = generateTainanCharacterName();
		setName(generatedName);
	};

	const handleSave = () => {
		
	};

	return (
		<Container className={styles.container}>
			<Text className={styles.title}>個人設定</Text>

			<Group>
				<Text className={styles.itemTitle}>暱稱</Text>
				<TextInput
					value={name}
					onChange={(e) => setName(e.target.value)}
					className={styles.textInput}
				/>
				<Button onClick={handleGenerateName} >
					<IoDice className={styles.diceButton}/>
				</Button>
			</Group>
			<Text>該名稱將顯示於評價上，請謹慎使用名稱</Text>

			<Button
				fullWidth
				onClick={handleSave}
			>
				儲存
			</Button>
		</Container>
	);
}

export default ProfilePage;