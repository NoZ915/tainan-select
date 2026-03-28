import { Button } from '@mantine/core'
import { Link } from 'react-router-dom'
import styles from '../styles/pages/NotFoundPage.module.css'

const MailErrorPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.code}>!</div>
      <h1 className={styles.title}>信箱驗證失敗</h1>
      <p className={styles.description}>
        本平台僅開放 <strong>@gm2.nutn.edu.tw</strong> 的 Google 帳號登入或註冊。
      </p>
      <Button component={Link} to='/' className={styles.homeButton}>
        回首頁
      </Button>
    </div>
  )
}

export default MailErrorPage
