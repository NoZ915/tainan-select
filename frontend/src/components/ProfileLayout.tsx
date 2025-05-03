import { AppShell, NavLink, Stack } from "@mantine/core";

interface ProfileLayoutProps {
	currentTab: string;
	onTabChange: (tab: string) => void;
	children: React.ReactNode;
}

const tabs = [
	{ label: "個人設定", value: "settings" },
	{ label: "個人收藏", value: "favorites" },
	{ label: "個人評價", value: "reviews" }
];

const ProfileLayout: React.FC<ProfileLayoutProps> = ({ currentTab, onTabChange, children }) => {
	return (
		<AppShell
			header={{ height: 60 }}
			navbar={{
				width: 300,
				breakpoint: 'sm',
				// collapsed: { mobile: !opened },
			}}
			styles={{
				main: {
					backgroundColor: "#f8f9fa", // 主內容背景色
				},
			}}
		>
			<AppShell.Header>Header</AppShell.Header>
			<AppShell.Navbar 
				p="md" 
				style={{
					backgroundColor: "#f8f9fa", // 導覽列背景色與 main 一致
				}}
			>
        <Stack>
          {tabs.map((tab) => (
            <NavLink
              key={tab.value}
              label={tab.label}
              active={currentTab === tab.value}
              onClick={() => onTabChange(tab.value)}
							color="#F4DEA9"
							variant="filled"
            />
          ))}
        </Stack>
      </AppShell.Navbar>
			{children}
		</AppShell>
	);
}

export default ProfileLayout;