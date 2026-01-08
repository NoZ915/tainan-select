import { Link } from 'react-router-dom'

import { Card, Group, Stack, Text } from '@mantine/core'

import style from '../styles/components/FrequentLinkCard.module.css'

export interface LinkItem {
  id: string
  title: string
  desc?: string
  href: string
  isExternal?: boolean
  imageSrc: string
  imageAlt?: string
}

interface FrequentLinkCardProp {
  item: LinkItem
}

const FrequentLinkCard: React.FC<FrequentLinkCardProp> = ({ item }) => {
  const isInternal = item.isExternal === false

  const cardContent = (
    <Group gap='md' align='center' wrap='nowrap' className={style.content}>
      <div className={style.imageWrapper}>
        <img
          src={item.imageSrc}
          alt={item.imageAlt ?? item.title}
          className={style.image}
          loading='lazy'
        />
      </div>

      <Stack gap={2} style={{ flex: 1 }}>
        <Text fw={500}>{item.title}</Text>
        {item.desc ? <Text size='sm' c='dimmed'>{item.desc}</Text> : null}
      </Stack>
    </Group >
  )

  return (
    <Card padding='md' className={style.card}>
      {isInternal ? (
        <Link
          to={item.href}
          style={{ textDecoration: 'none', flexGrow: 1, color: 'black' }}
        >
          {cardContent}
        </Link>
      ) : (
        <a
          href={item.href}
          target='_blank'
          rel='noopener noreferrer'
          style={{ textDecoration: 'none', flexGrow: 1, color: 'black' }}
        >
          {cardContent}
        </a>
      )}
    </Card>
  )
}

export default FrequentLinkCard
