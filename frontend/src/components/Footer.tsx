import { Container, Text } from '@mantine/core'
import { FaInstagram } from 'react-icons/fa'
import styles from '../styles/components/footer.module.css'

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <Container size='lg' className={styles.container}>
        <Text size='sm' className={styles.text}>
          © 2026 nutnselect
        </Text>
        <a
          href='https://www.instagram.com/nutnselect'
          target='_blank'
          rel='noopener noreferrer'
          className={styles.socialLink}
        >
          <FaInstagram size={16} />
          nutnselect
        </a>
      </Container>
    </footer>
  )
}

export default Footer
