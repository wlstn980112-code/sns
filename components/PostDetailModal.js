import { useState, useRef, useEffect } from 'react'
import styles from '../styles/PostDetailModal.module.css'

export default function PostDetailModal({ post, isOpen, onClose, onLikeUpdate, onCommentAdd, onCommentDelete, onCommentLikeUpdate }) {
  const [commentText, setCommentText] = useState('')
  const [isLiked, setIsLiked] = useState(false)
  const [currentLikesCount, setCurrentLikesCount] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const commentInputRef = useRef(null)
  const currentUser = '나' // 실제로는 로그인한 사용자 정보에서 가져옴

  console.log('[PostDetailModal] 모달 상태:', isOpen, '게시물 ID:', post?.id);

  // post가 변경될 때 좋아요 상태와 좋아요 수 업데이트
  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked || false)
      setCurrentLikesCount(post.likesCount)
      setCurrentImageIndex(0) // 모달이 열릴 때 첫 번째 이미지로 리셋
      console.log('[PostDetailModal] 게시물 데이터 업데이트 - 좋아요 상태:', post.isLiked, '좋아요 수:', post.likesCount);
    }
  }, [post])

  // 키보드 화살표로 이미지 넘기기
  useEffect(() => {
    if (!isOpen || !post || !post.images || post.images.length <= 1) return

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : post.images.length - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => (prev < post.images.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, post])

  const handlePreviousImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : post.images.length - 1))
    }
  }

  const handleNextImage = () => {
    if (post.images && post.images.length > 1) {
      setCurrentImageIndex(prev => (prev < post.images.length - 1 ? prev + 1 : 0))
    }
  }

  // 게시물의 이미지 배열 가져오기
  const images = post.images || (post.imageURL ? [post.imageURL] : [])
  const currentImage = images[currentImageIndex] || post.imageURL

  if (!isOpen || !post) return null

  const handleLikeClick = () => {
    console.log('[PostDetailModal] 좋아요 클릭, 현재 상태:', isLiked);
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    
    // 좋아요 수 즉시 업데이트 (UI 반응성 향상)
    const likeChange = newLikedState ? 1 : -1
    const newLikesCount = Math.max(0, currentLikesCount + likeChange)
    setCurrentLikesCount(newLikesCount)
    
    // 부모 컴포넌트에 좋아요 상태 전달 (게시물 데이터 업데이트)
    if (onLikeUpdate) {
      onLikeUpdate(post.id, newLikedState)
      console.log('[PostDetailModal] 좋아요 상태 전달:', newLikedState);
    }
  }

  const handleCommentSubmit = (e) => {
    e.preventDefault()
    
    if (!commentText.trim()) {
      return
    }

    console.log('[PostDetailModal] 댓글 추가:', commentText);

    const newComment = {
      id: Date.now(),
      username: currentUser,
      text: commentText.trim(),
      timestamp: new Date().toISOString(),
      likesCount: 0,
      isLiked: false
    }

    if (onCommentAdd) {
      onCommentAdd(post.id, newComment)
    }

    setCommentText('')
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('[PostDetailModal] 오버레이 클릭 - 모달 닫기');
      onClose()
    }
  }

  const handleCommentLikeClick = (commentId, currentLikedState) => {
    console.log('[PostDetailModal] 댓글 좋아요 클릭:', commentId, '현재 상태:', currentLikedState);
    const newLikedState = !currentLikedState
    
    if (onCommentLikeUpdate) {
      onCommentLikeUpdate(post.id, commentId, newLikedState)
    }
  }

  const handleCommentDelete = (commentId) => {
    console.log('[PostDetailModal] 댓글 삭제:', commentId);
    
    if (window.confirm('댓글을 삭제하시겠습니까?')) {
      if (onCommentDelete) {
        onCommentDelete(post.id, commentId)
      }
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <div className={styles.postContainer}>
          {/* 이미지 섹션 */}
          <div className={styles.imageSection}>
            {images.length > 1 ? (
              <div className={styles.imageSlider}>
                {/* 이전 버튼 */}
                <button
                  className={styles.navButton}
                  onClick={handlePreviousImage}
                  aria-label="이전 이미지"
                >
                  ‹
                </button>

                {/* 현재 이미지 */}
                <div className={styles.currentImageWrapper}>
                  <div className={styles.imageCounter}>
                    {currentImageIndex + 1} / {images.length}
                  </div>
                  <img
                    src={currentImage}
                    alt={post.caption}
                    className={styles.postImage}
                  />
                </div>

                {/* 다음 버튼 */}
                <button
                  className={styles.navButton}
                  onClick={handleNextImage}
                  aria-label="다음 이미지"
                >
                  ›
                </button>

                {/* 이미지 인디케이터 */}
                <div className={styles.imageIndicators}>
                  {images.map((_, index) => (
                    <span
                      key={index}
                      className={`${styles.indicator} ${currentImageIndex === index ? styles.activeIndicator : ''}`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <img
                src={currentImage}
                alt={post.caption}
                className={styles.postImage}
              />
            )}
          </div>

          {/* 콘텐츠 섹션 */}
          <div className={styles.contentSection}>
            {/* 헤더 */}
            <div className={styles.postHeader}>
              <h3 className={styles.username}>{post.username}</h3>
            </div>

            {/* 댓글 영역 */}
            <div className={styles.commentsSection}>
              {/* 게시물 설명 */}
              <div className={styles.postCaption}>
                <span className={styles.captionUsername}>{post.username}</span>
                <span className={styles.captionText}>{post.caption}</span>
              </div>

              {/* 댓글 목록 */}
              <div className={styles.commentsList}>
                {post.comments && post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment.id} className={styles.comment}>
                      <div className={styles.commentContent}>
                        <span className={styles.commentUsername}>{comment.username}</span>
                        <span className={styles.commentText}>{comment.text}</span>
                      </div>
                      <div className={styles.commentActions}>
                        <button
                          className={`${styles.commentLikeButton} ${comment.isLiked ? styles.commentLiked : ''}`}
                          onClick={() => handleCommentLikeClick(comment.id, comment.isLiked || false)}
                        >
                          {comment.isLiked ? '❤️' : '🤍'}
                          {(comment.likesCount || 0) > 0 && (
                            <span className={styles.commentLikeCount}>
                              {comment.likesCount}
                            </span>
                          )}
                        </button>
                        {comment.username === currentUser && (
                          <button
                            className={styles.commentDeleteButton}
                            onClick={() => handleCommentDelete(comment.id)}
                            title="댓글 삭제"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.noComments}>아직 댓글이 없습니다.</div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className={styles.actions}>
              <button
                className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                onClick={handleLikeClick}
              >
                {isLiked ? '❤️' : '🤍'}
                <span className={styles.likeCount}>{currentLikesCount.toLocaleString()}</span>
              </button>
            </div>

            {/* 댓글 입력 */}
            <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className={styles.commentInput}
                maxLength={200}
              />
              <button
                type="submit"
                className={styles.commentSubmitButton}
                disabled={!commentText.trim()}
              >
                게시
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

