import { Container, SimpleGrid, Stack, Text, Title } from '@mantine/core'

import { FREQUENT_LINKS } from '../constants/frequentPage'
import FrequentLinkCard from '../components/FrequentLinkCard'
import styles from '../styles/pages/FrequentPage.module.css'

const FrequentPage: React.FC = () => {
  return (
    <Container size='md' py='lg'>
      <Stack gap='xl'>
        <Stack gap={6} className={styles.heading}>
          <Title order={2}>常用連結</Title>
          <Text c='dimmed' size='sm'>
            把校園常用系統集中在一頁：選課、課綱、請假、平台⋯⋯需要時一鍵開。
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing='md'>
          {FREQUENT_LINKS.map((item) => (
            <FrequentLinkCard
              key={item.id}
              item={item}
            />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  )
}

export default FrequentPage
