import { Badge, Box, Container, Divider, Stack, Text, Title } from '@mantine/core'

import { VERSION_HISTORY } from '../constants/versionHistory'
import styles from '../styles/pages/VersionsPage.module.css'

const KIND_BADGE: Record<
  (typeof VERSION_HISTORY)[number]['kind'],
  { label: string; color: string }
> = {
  feat: { label: 'feat', color: 'green' },
  enhancement: { label: 'enhancement', color: 'blue' },
  fix: { label: 'fix', color: 'red' },
}

const VersionsPage: React.FC = () => {
  return (
    <Container size='md' py='lg'>
      <Stack gap='md'>
        <Stack gap={6}>
          <Title order={2}>版本更新紀錄</Title>
          <Text c='dimmed' size='sm' className={styles.subtleText}>
            紀錄一下都把時間丟到哪裡去。
          </Text>
        </Stack>

        <Divider />

        <div className={styles.timeline}>
          {VERSION_HISTORY.map((entry) => (
            <article key={entry.version} className={styles.item}>
              <div className={styles.content}>
                <div className={styles.contentHeader}>
                  <Box className={styles.titleBlock}>
                    <h3 className={styles.title}>{entry.title}</h3>
                    <div className={styles.meta}>發布日期：{entry.releasedAt}</div>
                  </Box>
                  <div className={styles.badgesBox}>
                    <Badge
                      className={styles.kindBadge}
                      variant='light'
                      color={KIND_BADGE[entry.kind].color}
                    >
                      {KIND_BADGE[entry.kind].label}
                    </Badge>
                    <Badge className={styles.versionBadge} variant='light'>
                      {entry.version}
                    </Badge>
                  </div>
                </div>

                <p className={styles.summary}>{entry.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </Stack>
    </Container>
  )
}

export default VersionsPage
