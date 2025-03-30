import { Group, Text, Box, Container, Image, Burger, Drawer } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/components/Header.module.css';
import AuthButton from './AuthButton';
import { useState } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

const Header: React.FC = () => {
  const location = useLocation(); // 用於獲取當前路徑
  const isMobile = useIsMobile();
  const [opened, setOpened] = useState(false);

  // 定義導航項目
  const navItems = [
    { label: "搜尋", path: "/" },
    { label: "動態", path: "/dynamic" },
    { label: "常用", path: "/frequent" },
  ];

  if (isMobile) {
    return (
      <>
        <Box className={styles.navBox} >
          <Group gap="sm">
            <Burger opened={opened} onClick={() => setOpened((openStatus) => !openStatus)} size="md" />
            <Link to="/">
              <Image src="/images/logo.png" className={styles.logo} alt="Logo" />
            </Link>
          </Group>
        </Box>

        <Drawer opened={opened} onClose={() => setOpened(false)} >
          <nav className={styles.mobileNav}>
            {navItems.map((item) => (
              <Link
                to={item.path}
                key={item.path}
                onClick={() => setOpened(false)}
                className={styles.mobileLink}
              >
                {item.label}
              </Link>
            ))}
            <AuthButton className={styles.mobileAuthButton} />
          </nav>

        </Drawer>
      </>
    )
  }

  return (
    <header className={styles.header}>
      <Container size="lg" className={styles.container}>
        <Box className={styles.navBox}>
          <Group gap="sm">
            <Link to="/">
              <Image src="/images/logo.png" className={styles.logo} alt="Logo" />
            </Link>
            {navItems.map((item) => (
              <Text
                key={item.path}
                component={Link}
                to={item.path}
                className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ""}`}
              >
                {item.label}
              </Text>
            ))}
          </Group>
        </Box>
        <AuthButton className={styles.authButton} />
      </Container>
    </header>
  );
};

export default Header;