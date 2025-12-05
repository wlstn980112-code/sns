import { useState, useImperativeHandle, forwardRef, useCallback, useEffect, useRef } from 'react'
import PostDetailModal from './PostDetailModal'
import styles from '../styles/PostGrid.module.css'

const PostGrid = forwardRef((props, ref) => {
  console.log('[PostGrid] 컴포넌트 렌더링 시작');
  
  const { filterByUser, onPostDelete, showDeleteButton = false } = props

  // localStorage 키
  const STORAGE_KEY = 'sns-posts'

  // 더미 게시물 데이터 (댓글 포함, 좋아요 상태 포함)
  const defaultPosts = [
    {
      id: 1,
      imageURL: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
      username: '맛있는요리',
      likesCount: 1234,
      isLiked: false, // 좋아요 상태 추가
      caption: '오늘 만든 파스타! 정말 맛있었어요 🍝',
      comments: [
        { id: 1, username: '요리초보', text: '와 정말 맛있어 보여요! 레시피 공유해주세요!', timestamp: '2024-01-01T10:00:00Z', likesCount: 5, isLiked: false },
        { id: 2, username: '홈쿡러', text: '저도 만들어봐야겠어요 😊', timestamp: '2024-01-01T11:00:00Z', likesCount: 3, isLiked: false }
      ]
    },
    {
      id: 2,
      imageURL: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
      username: '홈쿡러',
      likesCount: 856,
      isLiked: false,
      caption: '집에서 만든 피자 🍕',
      comments: [
        { id: 3, username: '피자러버', text: '완벽해요!', timestamp: '2024-01-02T10:00:00Z', likesCount: 2, isLiked: false }
      ]
    },
    {
      id: 3,
      imageURL: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop',
      username: '요리왕',
      likesCount: 2341,
      isLiked: false,
      caption: '한국 전통 음식 비빔밥!',
      comments: []
    },
    {
      id: 4,
      imageURL: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=400&h=400&fit=crop',
      username: '맛집탐방',
      likesCount: 1892,
      isLiked: false,
      caption: '맛있는 햄버거 발견! 🍔',
      comments: [
        { id: 4, username: '햄버거왕', text: '어디서 먹었나요?', timestamp: '2024-01-03T10:00:00Z', likesCount: 1, isLiked: false }
      ]
    },
    {
      id: 5,
      imageURL: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=400&fit=crop',
      username: '디저트러버',
      likesCount: 3456,
      isLiked: false,
      caption: '홈메이드 케이크 완성! 🎂',
      comments: [
        { id: 5, username: '케이크마니아', text: '너무 예뻐요!', timestamp: '2024-01-04T10:00:00Z', likesCount: 8, isLiked: false },
        { id: 6, username: '베이킹초보', text: '레시피 알려주세요!', timestamp: '2024-01-04T11:00:00Z', likesCount: 4, isLiked: false }
      ]
    }
  ]

  // localStorage에서 게시물 불러오기
  const loadPostsFromStorage = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedPosts = JSON.parse(stored)
        console.log('[PostGrid] localStorage에서 게시물 불러오기 성공:', parsedPosts.length, '개');
        return parsedPosts.map(post => ({
          ...post,
          images: post.images || (post.imageURL ? [post.imageURL] : [])
        }))
      }
    } catch (error) {
      console.error('[PostGrid] localStorage에서 게시물 불러오기 실패:', error);
    }
    // localStorage에 데이터가 없으면 기본 게시물 반환
    console.log('[PostGrid] localStorage에 데이터 없음, 기본 게시물 사용');
    return defaultPosts.map(post => ({
      ...post,
      images: post.images || [post.imageURL]
    }))
  }

  // localStorage에 게시물 저장하기
  const savePostsToStorage = (posts) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
      console.log('[PostGrid] localStorage에 게시물 저장 완료:', posts.length, '개');
    } catch (error) {
      console.error('[PostGrid] localStorage에 게시물 저장 실패:', error);
    }
  }

  const [allPosts, setAllPosts] = useState(() => loadPostsFromStorage())
  
  const [displayedCount, setDisplayedCount] = useState(6) // 초기 표시 개수
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const loadMoreRef = useRef(null)
  
  const [hoveredPost, setHoveredPost] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [postImageIndices, setPostImageIndices] = useState({}) // 각 게시물의 현재 이미지 인덱스

  // 게시물 삭제 함수
  const deletePost = useCallback((postId) => {
    console.log('[PostGrid] 게시물 삭제:', postId);
    
    // 먼저 선택된 게시물이 삭제될 예정이면 모달 닫기
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null)
    }
    
    if (!window.confirm('게시물을 삭제하시겠습니까?')) {
      console.log('[PostGrid] 게시물 삭제 취소');
      return;
    }

    try {
      setAllPosts(prevPosts => {
        const filtered = prevPosts.filter(post => post.id !== postId)
        console.log('[PostGrid] 게시물 삭제 완료, 남은 게시물:', filtered.length);
        // localStorage에 저장
        savePostsToStorage(filtered)
        return filtered
      })
      
      // 표시 개수 조정
      setDisplayedCount(prev => Math.max(6, prev - 1))
      
      // 부모 컴포넌트에 삭제 알림
      if (onPostDelete) {
        onPostDelete(postId)
      }
    } catch (error) {
      console.error('[PostGrid] 게시물 삭제 중 오류 발생:', error);
    }
  }, [selectedPost, onPostDelete])

  // 표시할 게시물 계산 (필터링 적용)
  const filteredPosts = filterByUser 
    ? allPosts.filter(post => post.username === filterByUser)
    : allPosts
  
  const posts = filteredPosts.slice(0, displayedCount)

  // 새 게시물 추가 함수 (useCallback으로 메모이제이션)
  const addPost = useCallback((newPost) => {
    console.log('[PostGrid] 새 게시물 추가:', newPost);
    try {
      // images 배열 또는 imageURL이 있어야 함
      if (!newPost || (!newPost.images && !newPost.imageURL)) {
        console.error('[PostGrid] 잘못된 게시물 데이터:', newPost);
        return;
      }
      // 댓글 배열과 좋아요 상태가 없으면 추가
      const images = newPost.images || (newPost.imageURL ? [newPost.imageURL] : [])
      const postWithComments = {
        ...newPost,
        images: images, // images 배열
        imageURL: images.length > 0 ? images[0] : (newPost.imageURL || ''), // 첫 번째 이미지를 imageURL로 설정
        comments: newPost.comments || [],
        isLiked: false // 새 게시물은 기본적으로 좋아요 안 누름
      }
      console.log('[PostGrid] 게시물 데이터:', postWithComments);
      
      // allPosts에 추가하고 맨 앞에 배치
      setAllPosts(prev => {
        const updated = [postWithComments, ...prev]
        // localStorage에 저장
        savePostsToStorage(updated)
        return updated
      })
      
      // 표시 개수도 증가 (새 게시물이 보이도록)
      setDisplayedCount(prev => prev + 1)
      
      console.log('[PostGrid] 게시물 추가 완료');
    } catch (error) {
      console.error('[PostGrid] 게시물 추가 중 오류 발생:', error);
    }
  }, [])

  // 좋아요 업데이트 함수 (토글 방식)
  const updateLike = useCallback((postId, newLikedState) => {
    console.log('[PostGrid] 좋아요 토글:', postId, '새 상태:', newLikedState);
    
    setAllPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post => {
        if (post.id === postId) {
          // 좋아요 상태 토글
          const wasLiked = post.isLiked || false
          const isNowLiked = newLikedState
          
          // 좋아요 수 계산 (이전 상태와 새 상태 비교)
          let newLikesCount = post.likesCount
          if (!wasLiked && isNowLiked) {
            // 좋아요 추가
            newLikesCount = post.likesCount + 1
          } else if (wasLiked && !isNowLiked) {
            // 좋아요 취소
            newLikesCount = Math.max(0, post.likesCount - 1)
          }
          
          return {
            ...post,
            isLiked: isNowLiked,
            likesCount: newLikesCount
          }
        }
        return post
      })
      
      // 선택된 게시물도 업데이트
      if (selectedPost && selectedPost.id === postId) {
        const updatedPost = updatedPosts.find(p => p.id === postId)
        if (updatedPost) {
          setSelectedPost(updatedPost)
        }
      }
      
      // localStorage에 저장
      savePostsToStorage(updatedPosts)
      
      return updatedPosts
    })
  }, [selectedPost])

  // 댓글 추가 함수
  const addComment = useCallback((postId, newComment) => {
    console.log('[PostGrid] 댓글 추가:', postId, newComment);
    
    setAllPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post =>
        post.id === postId
          ? { ...post, comments: [...(post.comments || []), newComment] }
          : post
      )
      
      // 선택된 게시물도 업데이트
      if (selectedPost && selectedPost.id === postId) {
        const updatedPost = updatedPosts.find(p => p.id === postId)
        if (updatedPost) {
          setSelectedPost(updatedPost)
        }
      }
      
      // localStorage에 저장
      savePostsToStorage(updatedPosts)
      
      return updatedPosts
    })
  }, [selectedPost])

  // ref를 통해 부모 컴포넌트에서 호출 가능하도록 expose
  useImperativeHandle(ref, () => ({
    addPost,
    updateLike,
    addComment,
    deletePost
  }), [addPost, updateLike, addComment, deletePost])

  const handleMouseEnter = (postId) => {
    console.log(`[PostGrid] 게시물 ${postId}에 마우스 호버`);
    setHoveredPost(postId)
  }

  const handleMouseLeave = () => {
    setHoveredPost(null)
  }

  const handlePostClick = (post, e) => {
    // 삭제 버튼이나 다른 버튼 클릭 시에는 모달을 열지 않음
    if (e && (e.target.closest('button') || e.target.closest('.deleteButton'))) {
      console.log('[PostGrid] 버튼 클릭으로 인한 게시물 클릭 무시');
      return;
    }
    
    console.log('[PostGrid] 게시물 클릭:', post.id);
    // images 배열이 없으면 imageURL로 배열 생성
    const postWithImages = {
      ...post,
      images: post.images || (post.imageURL ? [post.imageURL] : [])
    }
    setSelectedPost(postWithImages)
  }

  const handleCloseModal = () => {
    console.log('[PostGrid] 모달 닫기');
    setSelectedPost(null)
  }

  const handleLikeUpdate = (postId, newLikedState) => {
    updateLike(postId, newLikedState)
  }

  const handleCommentAdd = (postId, newComment) => {
    addComment(postId, newComment)
  }

  const handleCommentDelete = (postId, commentId) => {
    console.log('[PostGrid] 댓글 삭제:', postId, commentId);
    
    setAllPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              comments: (post.comments || []).filter(comment => comment.id !== commentId)
            }
          : post
      )
      
      // 선택된 게시물도 업데이트
      if (selectedPost && selectedPost.id === postId) {
        const updatedPost = updatedPosts.find(p => p.id === postId)
        if (updatedPost) {
          setSelectedPost(updatedPost)
        }
      }
      
      // localStorage에 저장
      savePostsToStorage(updatedPosts)
      
      return updatedPosts
    })
  }

  const handleCommentLikeUpdate = (postId, commentId, newLikedState) => {
    console.log('[PostGrid] 댓글 좋아요 토글:', postId, commentId, '새 상태:', newLikedState);
    
    setAllPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post => {
        if (post.id === postId) {
          const updatedComments = (post.comments || []).map(comment => {
            if (comment.id === commentId) {
              const wasLiked = comment.isLiked || false
              const isNowLiked = newLikedState
              
              // 좋아요 수 계산
              let newLikesCount = comment.likesCount || 0
              if (!wasLiked && isNowLiked) {
                newLikesCount = (comment.likesCount || 0) + 1
              } else if (wasLiked && !isNowLiked) {
                newLikesCount = Math.max(0, (comment.likesCount || 0) - 1)
              }
              
              return {
                ...comment,
                isLiked: isNowLiked,
                likesCount: newLikesCount
              }
            }
            return comment
          })
          
          return {
            ...post,
            comments: updatedComments
          }
        }
        return post
      })
      
      // 선택된 게시물도 업데이트
      if (selectedPost && selectedPost.id === postId) {
        const updatedPost = updatedPosts.find(p => p.id === postId)
        if (updatedPost) {
          setSelectedPost(updatedPost)
        }
      }
      
      // localStorage에 저장
      savePostsToStorage(updatedPosts)
      
      return updatedPosts
    })
  }

  // 무한 스크롤: 더 많은 게시물 로드
  const loadMorePosts = useCallback(() => {
    if (isLoading || !hasMore) return
    
    console.log('[PostGrid] 더 많은 게시물 로드 시작');
    setIsLoading(true)
    
    // 시뮬레이션: 실제로는 API 호출
    setTimeout(() => {
      const filteredPosts = filterByUser 
        ? allPosts.filter(post => post.username === filterByUser)
        : allPosts
      const currentTotal = filteredPosts.length
      const newDisplayedCount = Math.min(displayedCount + 6, currentTotal)
      
      setDisplayedCount(newDisplayedCount)
      setHasMore(newDisplayedCount < currentTotal)
      setIsLoading(false)
      
      console.log('[PostGrid] 게시물 로드 완료:', newDisplayedCount, '/', currentTotal);
    }, 500) // 로딩 시뮬레이션
  }, [displayedCount, isLoading, hasMore, allPosts, filterByUser])

  // Intersection Observer로 하단 감지
  useEffect(() => {
    if (!loadMoreRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    )

    observer.observe(loadMoreRef.current)

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [hasMore, isLoading, loadMorePosts])

  // 게시물이 추가되면 hasMore 업데이트
  useEffect(() => {
    const filteredPosts = filterByUser 
      ? allPosts.filter(post => post.username === filterByUser)
      : allPosts
    const currentTotal = filteredPosts.length
    setHasMore(displayedCount < currentTotal)
  }, [displayedCount, allPosts, filterByUser])

  return (
    <>
      <div className={styles.postGrid}>
        {posts.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              {filterByUser ? '아직 올린 게시물이 없습니다.' : '게시물이 없습니다.'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
          <div
            key={post.id}
            className={styles.postCard}
            onMouseEnter={() => handleMouseEnter(post.id)}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => handlePostClick(post, e)}
          >
            <div className={styles.imageContainer}>
              {(() => {
                // 이미지 URL 결정: images 배열이 있으면 첫 번째 이미지, 없으면 imageURL 사용
                const images = post.images || (post.imageURL ? [post.imageURL] : [])
                const currentImageIndex = postImageIndices[post.id] || 0
                const displayImage = images.length > 0 ? images[currentImageIndex] : post.imageURL
                
                if (!displayImage) {
                  return <div className={styles.noImage}>이미지 없음</div>
                }

                return (
                  <>
                    {images.length > 1 ? (
                      <div className={styles.imageSlider}>
                        <img
                          src={displayImage}
                          alt={post.caption}
                          className={styles.postImage}
                        />
                        <div className={styles.imageDots}>
                          {images.map((_, index) => (
                            <span
                              key={index}
                              className={`${styles.dot} ${currentImageIndex === index ? styles.activeDot : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                setPostImageIndices(prev => ({ ...prev, [post.id]: index }))
                              }}
                            />
                          ))}
                        </div>
                        {hoveredPost === post.id && (
                          <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                              <p className={styles.username}>{post.username}</p>
                              <p className={styles.likes}>❤️ {post.likesCount.toLocaleString()}</p>
                              <p className={styles.comments}>💬 {post.comments ? post.comments.length : 0}</p>
                              <p className={styles.imageCount}>{images.length}장</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <img
                          src={displayImage}
                          alt={post.caption}
                          className={styles.postImage}
                        />
                        {hoveredPost === post.id && (
                          <div className={styles.overlay}>
                            <div className={styles.overlayContent}>
                              <p className={styles.username}>{post.username}</p>
                              <p className={styles.likes}>❤️ {post.likesCount.toLocaleString()}</p>
                              <p className={styles.comments}>💬 {post.comments ? post.comments.length : 0}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )
              })()}
            </div>
            <div className={styles.postInfo}>
              <p className={styles.caption}>{post.caption}</p>
              {showDeleteButton && filterByUser && post.username === filterByUser && (
                <button
                  className={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    deletePost(post.id)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                  }}
                  title="게시물 삭제"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        ))
        )}
        
        {/* 무한 스크롤 트리거 */}
        {hasMore && (
          <div ref={loadMoreRef} className={styles.loadMoreTrigger}>
            {isLoading && (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                <p>게시물을 불러오는 중...</p>
              </div>
            )}
          </div>
        )}
        
        {/* 더 이상 게시물이 없을 때 */}
        {!hasMore && posts.length > 0 && (
          <div className={styles.noMorePosts}>
            <p>모든 게시물을 불러왔습니다.</p>
          </div>
        )}
      </div>
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={handleCloseModal}
          onLikeUpdate={handleLikeUpdate}
          onCommentAdd={handleCommentAdd}
          onCommentDelete={handleCommentDelete}
          onCommentLikeUpdate={handleCommentLikeUpdate}
          onPostDelete={showDeleteButton && filterByUser && selectedPost.username === filterByUser ? deletePost : null}
          currentUser={filterByUser || '나'}
        />
      )}
    </>
  )
})

PostGrid.displayName = 'PostGrid'

export default PostGrid

