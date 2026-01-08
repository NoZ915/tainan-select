import { Container, Group, Text, ActionIcon } from '@mantine/core'
import { FaInstagram } from 'react-icons/fa'
import styles from '../styles/components/footer.module.css'

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <Container size='lg' className={styles.container}>
        <Group justify='space-between'>
          <Text size='sm' className={styles.text}>
            © 2025 nutnselect
          </Text>
          <Group gap='xs'>
            <ActionIcon
              component='a'
              href='https://www.instagram.com/nutnselect/profilecard/?igsh=MWQ4eWdhcTBrMnNuMA=='
              target='_blank'
              rel='noopener noreferrer'
              variant='subtle'
              size='lg'
              aria-label='Instagram'
            >
              <FaInstagram size={20} />
            </ActionIcon>
            <Text
              component='a'
              href='https://www.instagram.com/nutnselect/profilecard/?igsh=MWQ4eWdhcTBrMnNuMA=='
              target='_blank'
              rel='noopener noreferrer'
              size='sm'
              className={styles.linkText}
            >
              nutnselect
            </Text>
          </Group>
        </Group>
      </Container>
    </footer>
  )
}

export default Footer