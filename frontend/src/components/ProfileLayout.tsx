import { Box, Card, Container, Flex, NavLink, ScrollArea } from "@mantine/core";
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
			<Container>
				<Flex direction="column" gap="md">
					{/* 手機版導覽橫向滑動 */}
					<ScrollArea type="auto">
						<Flex gap="sm" wrap="nowrap">
							{tabs.map((tab) => (
								<NavLink
									key={tab.value}
									label={tab.label}
									active={currentTab === tab.value}
									onClick={() => onTabChange(tab.value)}
									variant="light"
									className={styles.mobileNavLink}
								/>
							))}
						</Flex>
					</ScrollArea>
					{children}
				</Flex>
			</Container>
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
