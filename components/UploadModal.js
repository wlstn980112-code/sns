import { useState, useRef, useEffect } from 'react'
import styles from '../styles/UploadModal.module.css'

export default function UploadModal({ isOpen, onClose, onUpload }) {
  const [imageList, setImageList] = useState([]) // 여러 이미지 배열
  const [currentImageIndex, setCurrentImageIndex] = useState(0) // 현재 보이는 이미지 인덱스
  const [username, setUsername] = useState('') // 공통 사진 이름
  const [caption, setCaption] = useState('') // 공통 설명
  const [isRemovingBg, setIsRemovingBg] = useState(false) // 배경 제거 중 상태
  const fileInputRef = useRef(null)

  console.log('[UploadModal] 모달 상태:', isOpen);

  // 키보드 화살표로 이미지 넘기기
  useEffect(() => {
    if (!isOpen || imageList.length <= 1) return

    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : imageList.length - 1))
      } else if (e.key === 'ArrowRight') {
        setCurrentImageIndex(prev => (prev < imageList.length - 1 ? prev + 1 : 0))
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, imageList.length])

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length === 0) return

    console.log('[UploadModal] 파일 선택:', files.length, '개');

    // 최대 10개 제한 확인
    const currentCount = imageList.length
    if (currentCount + files.length > 10) {
      alert(`최대 10개까지 업로드 가능합니다. (현재: ${currentCount}개, 선택: ${files.length}개)`)
      // 최대 개수까지만 선택
      files.splice(10 - currentCount)
    }

    // 각 파일 처리
    const newImages = []
    files.forEach((file, index) => {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}은(는) 이미지 파일이 아닙니다.`)
        return
      }

      // 파일 크기 검증 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name}의 파일 크기는 10MB 이하여야 합니다.`)
        return
      }

      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        newImages.push(reader.result)
        
        // 모든 파일 처리 완료 후 상태 업데이트
        if (newImages.length === files.length) {
          setImageList(prev => [...prev, ...newImages])
          setCurrentImageIndex(prev => prev === 0 && prev === 0 ? 0 : prev) // 첫 이미지로 이동
          console.log('[UploadModal] 이미지 추가 완료:', newImages.length, '개');
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : imageList.length - 1))
    console.log('[UploadModal] 이전 이미지로 이동:', currentImageIndex - 1);
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < imageList.length - 1 ? prev + 1 : 0))
    console.log('[UploadModal] 다음 이미지로 이동:', currentImageIndex + 1);
  }

  const handleRemoveCurrentImage = () => {
    if (imageList.length === 1) {
      // 마지막 이미지면 리스트 초기화
      setImageList([])
      setCurrentImageIndex(0)
      setUsername('')
      setCaption('')
    } else {
      const newList = imageList.filter((_, index) => index !== currentImageIndex)
      setImageList(newList)
      // 인덱스 조정
      if (currentImageIndex >= newList.length) {
        setCurrentImageIndex(newList.length - 1)
      }
    }
    console.log('[UploadModal] 현재 이미지 제거');
  }

  // 배경 제거 함수 (Canvas API 사용)
  const removeBackground = async () => {
    if (imageList.length === 0 || isRemovingBg) return

    setIsRemovingBg(true)
    console.log('[UploadModal] 배경 제거 시작');

    try {
      const currentImageSrc = imageList[currentImageIndex]
      
      // 이미지 로드
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = currentImageSrc
      })

      // Canvas 생성
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height

      // 이미지 그리기
      ctx.drawImage(img, 0, 0)

      // 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 가장자리 감지 및 배경 제거
      // 4개 모서리의 색상을 샘플링하여 배경색 추정
      const cornerSamples = [
        { x: 0, y: 0 }, // 좌상단
        { x: canvas.width - 1, y: 0 }, // 우상단
        { x: 0, y: canvas.height - 1 }, // 좌하단
        { x: canvas.width - 1, y: canvas.height - 1 } // 우하단
      ]

      const cornerColors = cornerSamples.map(corner => {
        const idx = (corner.y * canvas.width + corner.x) * 4
        return {
          r: data[idx],
          g: data[idx + 1],
          b: data[idx + 2],
          a: data[idx + 3]
        }
      })

      // 평균 배경색 계산
      const avgBgColor = {
        r: Math.round(cornerColors.reduce((sum, c) => sum + c.r, 0) / cornerColors.length),
        g: Math.round(cornerColors.reduce((sum, c) => sum + c.g, 0) / cornerColors.length),
        b: Math.round(cornerColors.reduce((sum, c) => sum + c.b, 0) / cornerColors.length)
      }

      // 유사도 임계값 (배경으로 간주할 색상 차이 범위)
      const threshold = 40

      // 각 픽셀 처리
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // 배경색과의 차이 계산
        const colorDiff = Math.sqrt(
          Math.pow(r - avgBgColor.r, 2) +
          Math.pow(g - avgBgColor.g, 2) +
          Math.pow(b - avgBgColor.b, 2)
        )

        // 가장자리 감지 (경계선 근처의 픽셀은 보존)
        const x = (i / 4) % canvas.width
        const y = Math.floor((i / 4) / canvas.width)
        const edgeDistance = Math.min(x, y, canvas.width - x, canvas.height - y)
        const edgeThreshold = Math.min(canvas.width, canvas.height) * 0.05

        // 배경색과 유사하고 가장자리가 아닌 경우 투명 처리
        if (colorDiff < threshold && edgeDistance > edgeThreshold) {
          data[i + 3] = 0 // 알파값을 0으로 설정 (투명)
        }
      }

      // 처리된 이미지 데이터를 Canvas에 적용
      ctx.putImageData(imageData, 0, 0)

      // Canvas를 이미지로 변환
      const processedImageSrc = canvas.toDataURL('image/png')

      // 이미지 리스트 업데이트
      const newImageList = [...imageList]
      newImageList[currentImageIndex] = processedImageSrc
      setImageList(newImageList)

      console.log('[UploadModal] 배경 제거 완료');
    } catch (error) {
      console.error('[UploadModal] 배경 제거 중 오류:', error)
      alert('배경 제거 중 오류가 발생했습니다.')
    } finally {
      setIsRemovingBg(false)
    }
  }

  const handleUpload = () => {
    if (imageList.length === 0) {
      alert('이미지를 선택해주세요.')
      return
    }

    // 사진 이름 확인
    if (!username.trim()) {
      alert('사진 이름을 입력해주세요.')
      return
    }

    console.log('[UploadModal] 게시물 업로드 시작:', imageList.length, '개');

    // 여러 이미지를 하나의 게시물로 묶어서 업로드
    const newPost = {
      id: Date.now(), // 고유 ID
      images: imageList, // 여러 이미지 배열
      imageURL: imageList[0], // 첫 번째 이미지 (호환성을 위해 유지)
      username: username.trim(),
      likesCount: 0,
      caption: caption.trim() || '맛있는 요리를 공유합니다! 🍽️',
      comments: [],
      isLiked: false
    }

    // 부모 컴포넌트에 전달
    onUpload(newPost)

    console.log('[UploadModal] 게시물 업로드 완료');

    // 폼 초기화
    setImageList([])
    setCurrentImageIndex(0)
    setUsername('')
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // 모달 닫기
    onClose()
  }

  const handleClose = () => {
    console.log('[UploadModal] 모달 닫기');
    setImageList([])
    setCurrentImageIndex(0)
    setUsername('')
    setCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>새 게시물 만들기</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* 파일 선택 영역 */}
          {imageList.length < 10 && (
            <div className={styles.uploadArea}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className={styles.fileInput}
                id="file-upload"
              />
              <label htmlFor="file-upload" className={styles.uploadLabel}>
                <div className={styles.uploadIcon}>📷</div>
                <p className={styles.uploadText}>사진을 선택하세요 (최대 10개)</p>
                <p className={styles.uploadHint}>클릭하여 이미지 선택 (현재: {imageList.length}/10)</p>
              </label>
            </div>
          )}

          {/* 선택된 이미지 슬라이더 */}
          {imageList.length > 0 && (
            <div className={styles.imageSliderContainer}>
              <div className={styles.imageSlider}>
                {/* 이전 버튼 */}
                {imageList.length > 1 && (
                  <button
                    className={styles.navButton}
                    onClick={handlePreviousImage}
                    aria-label="이전 이미지"
                  >
                    ‹
                  </button>
                )}

                {/* 현재 이미지 */}
                <div className={styles.currentImageWrapper}>
                  <div className={styles.imageCounter}>
                    {currentImageIndex + 1} / {imageList.length}
                  </div>
                  <img
                    src={imageList[currentImageIndex]}
                    alt={`미리보기 ${currentImageIndex + 1}`}
                    className={styles.currentImage}
                  />
                  <div className={styles.imageActions}>
                    <button
                      className={styles.removeBgButton}
                      onClick={removeBackground}
                      disabled={isRemovingBg}
                      aria-label="배경 제거"
                      title="배경 제거"
                    >
                      {isRemovingBg ? '처리 중...' : '🎨 배경 제거'}
                    </button>
                    <button
                      className={styles.removeCurrentButton}
                      onClick={handleRemoveCurrentImage}
                      aria-label="현재 이미지 제거"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 다음 버튼 */}
                {imageList.length > 1 && (
                  <button
                    className={styles.navButton}
                    onClick={handleNextImage}
                    aria-label="다음 이미지"
                  >
                    ›
                  </button>
                )}
              </div>

              {/* 공통 입력 폼 */}
              <div className={styles.commonForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="username" className={styles.label}>
                    사진 이름 *
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="사진 이름을 입력하세요"
                    className={styles.input}
                    maxLength={20}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="caption" className={styles.label}>
                    설명
                  </label>
                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="이 게시물에 대한 설명을 입력하세요..."
                    className={styles.textarea}
                    rows={4}
                    maxLength={200}
                  />
                  <span className={styles.charCount}>{caption.length}/200</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleClose}>
            취소
          </button>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={imageList.length === 0 || !username.trim()}
          >
            {imageList.length > 0 ? `${imageList.length}개 공유하기` : '공유하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

