import { useState, useRef, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PostGrid from '../components/PostGrid'
import styles from '../styles/MyPosts.module.css'

const CURRENT_USER = '나' // 현재 사용자 (실제로는 로그인 정보에서 가져옴)

export default function MyPosts() {
  console.log('[내 게시물 페이지] 페이지 렌더링 시작');

  const postGridRef = useRef(null)

  const handlePostDelete = useCallback((postId) => {
    console.log('[내 게시물 페이지] 게시물 삭제 요청:', postId);
    try {
      if (postGridRef.current && typeof postGridRef.current.deletePost === 'function') {
        postGridRef.current.deletePost(postId)
        console.log('[내 게시물 페이지] 게시물 삭제 성공');
      } else {
        console.error('[내 게시물 페이지] PostGrid ref가 올바르게 설정되지 않았습니다.');
      }
    } catch (error) {
      console.error('[내 게시물 페이지] 삭제 중 오류 발생:', error);
    }
  }, [])

  return (
    <>
      <Head>
        <title>내 게시물 - sns</title>
        <meta name="description" content="내가 올린 게시물들을 모아서 볼 수 있습니다" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/sns-feed" className={styles.backButton}>
              ← 돌아가기
            </Link>
          </div>
          <h1 className={styles.title}>내 게시물</h1>
          <p className={styles.subtitle}>내가 올린 게시물들을 모아서 볼 수 있어요</p>
        </div>
        <PostGrid 
          ref={postGridRef} 
          filterByUser={CURRENT_USER}
          onPostDelete={handlePostDelete}
          showDeleteButton={true}
        />
      </main>
    </>
  )
}

