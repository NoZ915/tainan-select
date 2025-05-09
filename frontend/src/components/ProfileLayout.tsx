import { Box, Card, Container, Flex, NavLink, Tabs } from "@mantine/core";
import styles from "../styles/components/ProfileLayout.module.css";
import { useIsMobile } from "../hooks/useIsMobile";

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
	const isMobile = useIsMobile();
	if (isMobile) {
		return (
			<Flex direction="column" gap="md">
				<Tabs
					value={currentTab}
					onChange={(value) => onTabChange(value ?? "settings")}
					className={styles.tabs}
					classNames={{ tab: styles.tab }}
				>
					<Tabs.List justify="center" className={styles.tabsList}>
						{tabs.map((tab) => (
							<Tabs.Tab key={tab.value} value={tab.value} fw={500}>
								{tab.label}
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs>
				{children}
			</Flex>
		);
	}

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
