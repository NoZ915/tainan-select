import { Button } from '@mantine/core'
import { Link } from 'react-router-dom'
import styles from '../styles/pages/NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>找不到頁面</h1>
      <p className={styles.description}>你輸入的網址不存在或已被移除。</p>
      <Button component={Link} to='/' className={styles.homeButton}>
        回首頁
      </Button>
    </div>
  )
}
