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
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons'
import TaskImage from './TaskImage'
export default function ImagePreview({ imagePreview, onClose, onPrev, onNext }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

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
      
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
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
  }, [isDragging, dragStart, imagePreview.show])

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

      <div 
        className="image-preview-container"
        style={{ textAlign: 'center' }}
      >
        <TaskImage 
          src={imagePreview.src} 
          alt="预览图片"
          onMouseDown={handleMouseDown}
          style={{ 
            maxWidth: '100%', 
            maxHeight: '70vh', 
            objectFit: 'contain',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
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
