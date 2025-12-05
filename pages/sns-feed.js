import { useState, useRef, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import PostGrid from "../components/PostGrid";
import UploadModal from "../components/UploadModal";
import styles from "../styles/SnsFeed.module.css";

export default function SnsFeed() {
  console.log("[SNS 피드 페이지] 페이지 렌더링 시작");

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const postGridRef = useRef(null);

  const handleUploadClick = () => {
    console.log("[SNS 피드 페이지] 업로드 버튼 클릭");
    setIsUploadModalOpen(true);
  };

  const handleUpload = useCallback((newPost) => {
    console.log("[SNS 피드 페이지] 새 게시물 업로드:", newPost);
    try {
      if (
        postGridRef.current &&
        typeof postGridRef.current.addPost === "function"
      ) {
        postGridRef.current.addPost(newPost);
        console.log("[SNS 피드 페이지] 게시물 추가 성공");
      } else {
        console.error(
          "[SNS 피드 페이지] PostGrid ref가 올바르게 설정되지 않았습니다."
        );
      }
    } catch (error) {
      console.error("[SNS 피드 페이지] 업로드 중 오류 발생:", error);
    }
  }, []);

  return (
    <>
      <Head>
        <title>sns</title>
        <meta name="description" content="맛있는 요리를 공유하는 SNS 피드" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>우리들의 손맛 공유</h1>
          <p className={styles.subtitle}>맛있는 요리를 함께 나눠요</p>
          <div className={styles.buttonGroup}>
            <Link href="/my-posts" className={styles.myPostsButton}>
              <span className={styles.myPostsIcon}>📝</span>
              <span>내 게시물</span>
            </Link>
            <button className={styles.uploadButton} onClick={handleUploadClick}>
              <span className={styles.uploadIcon}>📷</span>
              <span>사진 업로드</span>
            </button>
          </div>
        </div>
        <PostGrid ref={postGridRef} />
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      </main>
    </>
  );
}
