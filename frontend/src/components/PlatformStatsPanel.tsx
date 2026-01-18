import React, { useEffect, useState } from 'react'

import { useCountUp } from '../hooks/useCountUp'
import { useGetPlatformStats } from '../hooks/stats/useGetPlatformStats'

import { Container, Paper, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core'
import { FiBookOpen, FiMessageCircle, FiUsers } from 'react-icons/fi'

import styles from '../styles/components/PlatformStatsPanel.module.css'

type StatItemProps = {
  label: string
  value: number
  icon: React.ReactNode
  triggerKey: number // 用來每次進頁重播
}

const StatItem: React.FC<StatItemProps> = ({ label, value, icon, triggerKey }) => {
  const animatedValue = useCountUp(value, [triggerKey, value], { durationMs: 700, from: 0 })

  return (
    <Paper withBorder p='lg' className={styles.statCard}>
      <Stack align='center' gap={6}>
        <ThemeIcon variant='transparent' size={52} radius='md' className={styles.iconPop}>
          {icon}
        </ThemeIcon>

        <Text c='dimmed' fw={700} ta='center' className={styles.label}>
          {label}
        </Text>

        <Text
          fw={900}
          ta='center'
          className={styles.value}
          style={{ fontVariantNumeric: 'tabular-nums' }} // 避免數字跳動造成寬度抖動
        >
          {animatedValue.toLocaleString('zh-TW')}
        </Text>
      </Stack>
    </Paper>
  )
}

const PlatformStatsPanel: React.FC = () => {
  const [triggerKey, setTriggerKey] = useState(0)
  const { data: statsData } = useGetPlatformStats()
  useEffect(() => {
    setTriggerKey((k) => k + 1)
  }, [statsData])

  const stats = {
    reviewCount: statsData?.reviewCount ?? 0,
    userCount: statsData?.userCount ?? 0,
    courseCount: statsData?.courseCount ?? 0,
  }

  return (
    <Container className={styles.container}>
      <SimpleGrid cols={3} spacing={{ base: 'xs', sm: 'md' }}>
        <StatItem label='課程數' value={stats.courseCount} icon={<FiBookOpen size={52} />} triggerKey={triggerKey} />
        <StatItem label='評價數' value={stats.reviewCount} icon={<FiMessageCircle size={52} />} triggerKey={triggerKey} />
        <StatItem label='註冊人數' value={stats.userCount} icon={<FiUsers size={52} />} triggerKey={triggerKey} />
      </SimpleGrid>
    </Container>
  )
}

export default PlatformStatsPanel
