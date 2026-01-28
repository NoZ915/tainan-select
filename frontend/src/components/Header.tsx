import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaAngleDown } from 'react-icons/fa'

import { useIsMobile } from '../hooks/useIsMobile'

import { Group, Text, Box, Container, Image, Burger, Drawer, Menu, ActionIcon } from '@mantine/core'
import styles from '../styles/components/Header.module.css'

import AuthButton from './AuthButton'

const Header: React.FC = () => {
  const location = useLocation() // 用於獲取當前路徑
  const isMobile = useIsMobile()
  const [opened, setOpened] = useState(false)

  // 定義導航項目
  const navItems = [
    { label: '搜尋', path: '/' },
    { label: '動態', path: '/dynamic' },
    { label: '常用', path: '/frequent' },
  ]

  const aboutMenu = (
    <Menu shadow='md' width={220} position='bottom-end' withinPortal zIndex={1300}>
      <Menu.Target>
        <ActionIcon
          variant='subtle'
          color='dark'
          aria-label='更多資訊'
          className={styles.secondaryIcon}
        >
          <FaAngleDown size={18} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown className={styles.menuDropdown}>
        <Menu.Item component={Link} to='/versions'>
          版本紀錄
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )

  if (isMobile) {
    return (
      <header className={styles.header}>
        <Box className={styles.navBox}>
          <Group gap='sm'>
            <Burger opened={opened} onClick={() => setOpened((openStatus) => !openStatus)} size='md' />
            <Link to='/'>
              <Image src='/images/logo.png' className={styles.logo} alt='Logo' />
            </Link>
          </Group>
        </Box>

        <Drawer opened={opened} onClose={() => setOpened(false)} zIndex={1100} size='80%'>
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
            <AuthButton className={styles.mobileAuthButton} onClick={() => setOpened(false)} />
            <Text
              component={Link}
              to='/versions'
              onClick={() => setOpened(false)}
              className={styles.mobileSecondaryLink}
            >
              版本紀錄
            </Text>
          </nav>
        </Drawer>
      </header>
    )
  }

  return (
    <header className={styles.header}>
      <Container size='lg' className={styles.container}>
        <Box className={styles.navBox}>
          <Group gap='sm'>
            <Link to='/'>
              <Image src='/images/logo.png' className={styles.logo} alt='Logo' />
            </Link>
            {navItems.map((item) => (
              <Text
                key={item.path}
                component={Link}
                to={item.path}
                className={`${styles.navItem} ${location.pathname === item.path ? styles.active : ''}`}
              >
                {item.label}
              </Text>
            ))}
          </Group>
        </Box>
        <Group gap='xs' className={styles.actionsGroup}>
          <AuthButton className={styles.authButton} />
          {aboutMenu}
        </Group>
      </Container>
    </header>
  )
}

export default Header
