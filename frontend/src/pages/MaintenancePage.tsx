import { useHead } from '@unhead/react'
import { FaInstagram, FaTools } from 'react-icons/fa'
import styles from '../styles/pages/MaintenancePage.module.css'

const WEEKDAYS = ['一', '二', '三', '四', '五']

// 裝飾用的迷你課表：每格的色塊種類，null 代表空堂
const TIMETABLE_CELLS: Array<'red' | 'cream' | 'dark' | null> = [
  'red', null, 'cream', null, 'red',
  null, 'cream', 'red', 'dark', null,
  'cream', 'red', null, 'cream', null,
  null, 'dark', 'cream', null, 'red',
]

export default function MaintenancePage() {
  useHead({
    title: '網站維護中｜台南選',
    meta: [{ name: 'robots', content: 'noindex, nofollow' }],
  })

  return (
    <main className={styles.container}>
      <section className={styles.card} aria-labelledby='maintenance-title'>
        <div className={styles.tape} aria-hidden='true' />

        <div className={styles.body}>
          <img src='/images/logo.png' alt='台南選' className={styles.logo} />

          <div className={styles.status}>
            <span className={styles.statusDot} aria-hidden='true' />
            維護進行中
          </div>

          <h1 id='maintenance-title' className={styles.title}>
            網站維護中
            <FaTools className={styles.titleIcon} aria-hidden='true' />
          </h1>

          <p className={styles.description}>
            我們正在搬遷服務，暫時無法使用。
            <br />
            請稍後再回來，謝謝你的耐心等候。
          </p>

          <div className={styles.timetable} aria-hidden='true'>
            {WEEKDAYS.map((day) => (
              <span key={day} className={styles.weekday}>{day}</span>
            ))}
            {TIMETABLE_CELLS.map((tone, index) => (
              <span
                key={index}
                className={`${styles.cell} ${tone ? styles[tone] : ''}`}
                style={{ animationDelay: `${(index % 5) * 0.12 + Math.floor(index / 5) * 0.2}s` }}
              />
            ))}
          </div>

          <p className={styles.footnote}>馬上回來 ✦</p>
        </div>

        <div className={styles.contact}>
          <p className={styles.contactText}>有任何問題，歡迎透過 IG 聯絡我們</p>
          <a
            href='https://www.instagram.com/nutnselect'
            target='_blank'
            rel='noopener noreferrer'
            className={styles.instagramLink}
          >
            <FaInstagram size={18} aria-hidden='true' />
            @nutnselect
          </a>
        </div>
      </section>
    </main>
  )
}
