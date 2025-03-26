import { Group, Text, Box, Container, Image, Button } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/components/Header.module.css';
import { useState } from 'react';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
  const location = useLocation(); // 用於獲取當前路徑
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 定義導航項目
  const navItems = [
    { label: "搜尋", path: "/" },
    { label: "動態", path: "/dynamic" },
    { label: "常用", path: "/frequent" },
  ];

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
        <Button
          onClick={() => setIsLoginModalOpen(true)}
          className={styles.loginButton}
        >
          登入 / 註冊
        </Button>
      </Container>
      <LoginModal opened={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
};

export default Header;