import Link from 'next/link'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  console.log('[메인 페이지] 홈 페이지 렌더링 시작');

  return (
    <>
      <Head>
        <title>sns</title>
        <meta name="description" content="우리들의 손맛 공유" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>sns</h1>
          
          <div className={styles.buttonContainer}>
            <Link href="/sns-feed" className={styles.featureButton}>
              <span className={styles.buttonText}>우리들의 손맛 공유</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}



