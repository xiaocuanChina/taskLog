/**
 * 图片预览模态框组件
 * 
 * 功能说明:
 * - 用于全屏预览任务中的附件图片
 * - 支持多图片浏览,可通过左右按钮或键盘方向键切换
 * - 支持键盘快捷键: ESC 关闭, 左右方向键切换图片
 * - 支持鼠标滚轮缩放图片
 * - 支持拖拽移动放大后的图片
 * - 显示当前图片索引和总数
 * 
 * 使用场景:
 * - 点击任务卡片中的图片时打开预览
 * - 查看任务的所有附件图片
 */
import { useEffect, useState, useCallback } from 'react'
import { Modal } from 'antd'
import { 
  LeftOutlined, 
  RightOutlined, 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  DeleteOutlined,
  CloseOutlined 
} from '@ant-design/icons'
import TaskImage from './TaskImage'
import styles from './ImagePreview.module.css'

export default function ImagePreview({ imagePreview, onClose, onPrev, onNext, onDelete }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })

  // 重置缩放比例和位置
  useEffect(() => {
    if (imagePreview.show) {
      setScale(1)
      setPosition({ x: 0, y: 0 })
    }
  }, [imagePreview.show, imagePreview.currentIndex])

  // 键盘快捷键
  useEffect(() => {
    if (!imagePreview.show) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && imagePreview.images.length > 1) {
        onPrev()
      } else if (e.key === 'ArrowRight' && imagePreview.images.length > 1) {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreview.show, imagePreview.images.length, onClose, onPrev, onNext])

  // 鼠标滚轮缩放
  useEffect(() => {
    if (!imagePreview.show) return

    const imageContainer = document.querySelector(`.${styles.imageContainer}`)
    if (!imageContainer) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
    }

    imageContainer.addEventListener('wheel', handleWheel, { passive: false })
    return () => imageContainer.removeEventListener('wheel', handleWheel)
  }, [imagePreview.show])

  // 鼠标拖拽移动图片
  useEffect(() => {
    if (!imagePreview.show || !isDragging) return

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      setPosition(prev => {
        const newX = prev.x + deltaX
        const newY = prev.y + deltaY

        const container = document.querySelector(`.${styles.imageContainer}`)
        if (!container || !imageDimensions.width || !imageDimensions.height) {
          return { x: newX, y: newY }
        }

        const containerRect = container.getBoundingClientRect()
        const scaledWidth = imageDimensions.width * scale
        const scaledHeight = imageDimensions.height * scale

        let limitX = 0
        if (scaledWidth > containerRect.width) {
          limitX = (scaledWidth - containerRect.width) / 2
        }

        let limitY = 0
        if (scaledHeight > containerRect.height) {
          limitY = (scaledHeight - containerRect.height) / 2
        }

        const boundedX = Math.max(-limitX, Math.min(limitX, newX))
        const boundedY = Math.max(-limitY, Math.min(limitY, newY))

        return { x: boundedX, y: boundedY }
      })

      setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, imagePreview.show, scale, imageDimensions])

  // 开始拖拽
  const handleMouseDown = useCallback((e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }, [scale])

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(3, prev + 0.2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }, [])

  // 删除确认
  const handleDelete = useCallback(() => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        onDelete(imagePreview.currentIndex)
        
        if (imagePreview.images.length <= 1) {
          onClose()
        } else if (imagePreview.currentIndex === imagePreview.images.length - 1) {
          onPrev()
        }
      }
    })
  }, [imagePreview.currentIndex, imagePreview.images.length, onDelete, onClose, onPrev])

  return (
    <Modal
      open={imagePreview.show}
      onCancel={onClose}
      footer={null}
      width="100vw"
      centered
      zIndex={1100}
      closeIcon={null}
      className={styles.modal}
      styles={{
        body: {
          padding: 0,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }
      }}
    >
      <div className={styles.previewWrapper}>
        {/* 关闭按钮 */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
          <CloseOutlined />
        </button>

        {/* 导航按钮 */}
        {imagePreview.images.length > 1 && (
          <>
            <button 
              className={`${styles.navBtn} ${styles.prevBtn}`} 
              onClick={onPrev}
              aria-label="上一张"
            >
              <LeftOutlined />
            </button>
            <button 
              className={`${styles.navBtn} ${styles.nextBtn}`} 
              onClick={onNext}
              aria-label="下一张"
            >
              <RightOutlined />
            </button>
          </>
        )}

        {/* 工具栏 */}
        <div className={styles.toolbar}>
          <button 
            className={styles.toolBtn}
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            aria-label="缩小"
          >
            <ZoomOutOutlined />
          </button>
          
          <div className={styles.scaleIndicator}>
            {Math.round(scale * 100)}%
          </div>
          
          <button 
            className={styles.toolBtn}
            onClick={handleZoomIn}
            disabled={scale >= 3}
            aria-label="放大"
          >
            <ZoomInOutlined />
          </button>
        </div>

        {/* 删除按钮 */}
        {onDelete && (
          <button 
            className={styles.deleteBtn}
            onClick={handleDelete}
            aria-label="删除图片"
          >
            <DeleteOutlined />
          </button>
        )}

        {/* 图片容器 */}
        <div className={styles.imageContainer}>
          <TaskImage
            src={imagePreview.src}
            alt="预览图片"
            onMouseDown={handleMouseDown}
            onLoad={(e) => {
              setImageDimensions({
                width: e.target.offsetWidth,
                height: e.target.offsetHeight
              })
            }}
            className={styles.image}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          />
        </div>

        {/* 图片计数器 */}
        {imagePreview.images.length > 1 && (
          <div className={styles.counter}>
            {imagePreview.currentIndex + 1} / {imagePreview.images.length}
          </div>
        )}
      </div>
    </Modal>
  )
}
