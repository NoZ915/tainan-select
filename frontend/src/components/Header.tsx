import { Group, Text, Box, Container, Image } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import styles from '../styles/components/Header.module.css';

const Header: React.FC = () => {
  const location = useLocation(); // 用於獲取當前路徑

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
        <Text component={Link} to="/login" className={styles.loginButton}>
          登入 / 註冊
        </Text>
      </Container>
    </header>
  );
};

export default Header;