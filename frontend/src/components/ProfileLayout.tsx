import { Box, Card, Container, NavLink } from "@mantine/core";
import styles from "../styles/components/ProfileLayout.module.css";

interface ProfileLayoutProps {
	currentTab: string;
	onTabChange: (tab: string) => void;
	children: React.ReactNode;
}

const tabs = [
	{ label: "個人設定", value: "settings" },
	{ label: "個人收藏", value: "interests" },
	{ label: "個人評價", value: "reviews" }
];

const ProfileLayout: React.FC<ProfileLayoutProps> = ({
	currentTab,
	onTabChange,
	children,
}) => {
	return (
		<Container className={styles.container} >
			<Box className={styles.box}>
				<Card className={styles.card}>
					{tabs.map((tab) => (
						<NavLink
							key={tab.value}
							label={tab.label}
							active={currentTab === tab.value}
							onClick={() => onTabChange(tab.value)}
							variant="light"
						/>
					))}
				</Card>

				<Card className={styles.cardRight}>
					{children}
				</Card>
			</Box>
		</Container>
	);
};

export default ProfileLayout;
