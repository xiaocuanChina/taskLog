/**
 * 图片预览模态框组件
 * 
 * 功能说明:
 * - 用于全屏预览任务中的附件图片
 * - 支持多图片浏览,可通过左右按钮或键盘方向键切换
 * - 支持键盘快捷键: ESC 关闭, 左右方向键切换图片
 * - 支持鼠标滚轮缩放图片
 * - 显示当前图片索引和总数
 * - 使用 Ant Design Modal 组件实现
 * 
 * 使用场景:
 * - 点击任务卡片中的图片时打开预览
 * - 查看任务的所有附件图片
 */
import { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined, DeleteOutlined } from '@ant-design/icons'
import TaskImage from './TaskImage'
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

  useEffect(() => {
    if (!imagePreview.show) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        onPrev()
      } else if (e.key === 'ArrowRight') {
        onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreview.show, onClose, onPrev, onNext])

  // 鼠标滚轮缩放 - 使用非passive监听器
  useEffect(() => {
    if (!imagePreview.show) return

    const imageContainer = document.querySelector('.image-preview-container')
    if (!imageContainer) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
    }

    // 添加非passive的wheel事件监听器
    imageContainer.addEventListener('wheel', handleWheel, { passive: false })
    return () => imageContainer.removeEventListener('wheel', handleWheel)
  }, [imagePreview.show])

  // 鼠标拖拽移动图片
  useEffect(() => {
    if (!imagePreview.show) return

    const handleMouseMove = (e) => {
      if (!isDragging) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      setIsDragging(true) // Ensure dragging state is maintained

      setPosition(prev => {
        const newX = prev.x + deltaX
        const newY = prev.y + deltaY

        // 获取容器尺寸
        const container = document.querySelector('.image-preview-container')
        if (!container || !imageDimensions.width || !imageDimensions.height) {
          return { x: newX, y: newY }
        }

        const containerRect = container.getBoundingClientRect()

        // 计算缩放后的图片尺寸
        const scaledWidth = imageDimensions.width * scale
        const scaledHeight = imageDimensions.height * scale

        // 计算水平边界 (assuming transform-origin: center)
        // 图片宽度大于容器时，允许拖动偏移量
        let limitX = 0
        if (scaledWidth > containerRect.width) {
          limitX = (scaledWidth - containerRect.width) / 2
        }

        // 计算垂直边界
        let limitY = 0
        if (scaledHeight > containerRect.height) {
          limitY = (scaledHeight - containerRect.height) / 2
        }

        // 限制位置在边界内
        // 注意：因为 transform-origin 是 center，所以向左拖动对应负值，向右对应正值
        // 范围应该是 [-limitX, limitX]
        const boundedX = Math.max(-limitX, Math.min(limitX, newX))
        const boundedY = Math.max(-limitY, Math.min(limitY, newY))

        return {
          x: boundedX,
          y: boundedY
        }
      })

      setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart, imagePreview.show, scale, imageDimensions])

  // 开始拖拽
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }

  // 放大
  const handleZoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.2))
  }

  // 缩小
  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.2))
  }

  return (
    <Modal
      open={imagePreview.show}
      onCancel={onClose}
      footer={null}
      width="90vw"
      centered
      zIndex={1100}
      style={{ top: 20 }}
      styles={{
        body: {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '70vh',
          position: 'relative',
          overflow: 'auto'
        }
      }}
    >
      {imagePreview.images.length > 1 && (
        <>
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<LeftOutlined />}
            onClick={onPrev}
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1
            }}
          />
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<RightOutlined />}
            onClick={onNext}
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1
            }}
          />
        </>
      )}

      {/* 缩放控制按钮 */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        display: 'flex',
        gap: 8,
        zIndex: 1
      }}>
        <Button
          type="primary"
          shape="circle"
          icon={<ZoomOutOutlined />}
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
        />
        <div style={{
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 16,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          minWidth: 60,
          justifyContent: 'center'
        }}>
          {Math.round(scale * 100)}%
        </div>
        <Button
          type="primary"
          shape="circle"
          icon={<ZoomInOutlined />}
          onClick={handleZoomIn}
          disabled={scale >= 3}
        />
      </div>

      {/* 删除按钮 */}
      {onDelete && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}>
          <Button
            type="primary"
            danger
            shape="circle"
            size="large"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: '确定要删除这张图片吗？',
                okText: '删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: () => {
                  onDelete(imagePreview.currentIndex)

                  // 如果只有一张图片，删除后直接关闭
                  if (imagePreview.images.length <= 1) {
                    onClose()
                  } else {
                    // 如果有多张图片，删除当前图片后，如果当前是最后一张，则显示前一张，否则显示下一张
                    if (imagePreview.currentIndex === imagePreview.images.length - 1) {
                      onPrev()
                    } else {
                      // 当前位置的图片被删除了，后面的图片会前移，所以索引不用变，但需要强制更新视图
                      // 这里我们通过 onNext 切换一下（或者父组件需要传递更新后的 images）
                      // 注意：ImagePreview 组件依赖父组件传递的 imagePreview.images
                      // 当父组件更新了 images 后，组件会重新渲染
                      // 这里我们只需要确保 currentIndex 指向正确的位置
                    }
                  }
                }
              })
            }}
          />
        </div>
      )}

      <div
        className="image-preview-container"
        style={{ textAlign: 'center' }}
      >
        <TaskImage
          src={imagePreview.src}
          alt="预览图片"
          onMouseDown={handleMouseDown}
          onLoad={(e) => {
            // 记录图片的实际显示尺寸
            setImageDimensions({
              width: e.target.offsetWidth,
              height: e.target.offsetHeight
            })
          }}
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none'
          }}
        />

        {imagePreview.images.length > 1 && (
          <div style={{
            marginTop: 16,
            fontSize: 14,
            color: '#8c8c8c'
          }}>
            {imagePreview.currentIndex + 1} / {imagePreview.images.length}
          </div>
        )}
      </div>
    </Modal>
  )
}
