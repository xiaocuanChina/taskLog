/**
 * 删除任务确认模态框组件 - 现代化设计
 * 
 * 设计理念:
 * - 清晰展示任务详细信息，让用户明确删除内容
 * - 突出显示任务的关键属性（类型、模块、图片等）
 * - 支持图片预览，让用户在删除前查看关联图片
 * - 使用视觉层次强化危险操作的认知
 * - 提供清晰的警告信息
 */
import React, { useState } from 'react'
import { Modal, Alert, Divider, Tag } from 'antd'
import { 
  ExclamationCircleOutlined, 
  FileTextOutlined,
  FolderOutlined,
  FileImageOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  CheckSquareOutlined,
  EyeOutlined
} from '@ant-design/icons'
import TaskImage from '../common/TaskImage'
import styles from './DeleteTaskModal.module.css'

export default function DeleteTaskModal({ 
  show, 
  task,
  taskTypeColor,
  onConfirm, 
  onCancel 
}) {
  if (!task) return null

  // 图片预览状态
  const [previewImage, setPreviewImage] = useState(null)
  const [previewIndex, setPreviewIndex] = useState(0)

  // 格式化日期
  const formatDate = (dateString) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 统计信息
  const imageCount = task.images?.length || 0
  const checkListCount = task.checkList?.length || 0
  const completedCheckCount = task.checkList?.filter(item => item.checked).length || 0
  const hasDescription = task.description && task.description.trim().length > 0

  // 打开图片预览
  const handleImageClick = (image, index) => {
    setPreviewImage(image)
    setPreviewIndex(index)
  }

  // 关闭图片预览
  const handleClosePreview = () => {
    setPreviewImage(null)
    setPreviewIndex(0)
  }

  // 上一张图片
  const handlePrevImage = () => {
    if (task.images && task.images.length > 0) {
      const newIndex = (previewIndex - 1 + task.images.length) % task.images.length
      setPreviewIndex(newIndex)
      setPreviewImage(task.images[newIndex])
    }
  }

  // 下一张图片
  const handleNextImage = () => {
    if (task.images && task.images.length > 0) {
      const newIndex = (previewIndex + 1) % task.images.length
      setPreviewIndex(newIndex)
      setPreviewImage(task.images[newIndex])
    }
  }

  return (
    <Modal
      open={show}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ 
        danger: true,
        size: 'large',
        icon: <DeleteOutlined />
      }}
      cancelButtonProps={{ size: 'large' }}
      centered
      width={540}
      className={styles.modal}
    >
      <div className={styles.container}>
        {/* 警告图标 */}
        <div className={styles.iconWrapper}>
          <div className={styles.warningIcon}>
            <ExclamationCircleOutlined />
          </div>
        </div>

        {/* 标题 */}
        <h2 className={styles.title}>确认删除任务</h2>

        {/* 任务信息卡片 */}
        <div className={styles.taskCard}>
          {/* 任务头部 */}
          <div className={styles.taskHeader}>
            <div className={styles.taskIcon}>
              <FileTextOutlined />
            </div>
            <div className={styles.taskInfo}>
              <h3 className={styles.taskName}>{task.name}</h3>
              <div className={styles.taskMeta}>
                <ClockCircleOutlined className={styles.metaIcon} />
                <span className={styles.metaText}>
                  创建于 {formatDate(task.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* 任务属性标签 */}
          <div className={styles.taskTags}>
            {task.type && (
              <Tag 
                color={taskTypeColor || '#3b82f6'}
                style={{ 
                  margin: 0,
                  padding: '4px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 6
                }}
              >
                {task.type}
              </Tag>
            )}
            {task.module && (
              <div className={styles.moduleTag}>
                <FolderOutlined />
                <span>{task.module}</span>
              </div>
            )}
            {task.completed && (
              <Tag color="success" style={{ margin: 0, borderRadius: 6 }}>
                已完成
              </Tag>
            )}
            {task.shelved && (
              <Tag color="orange" style={{ margin: 0, borderRadius: 6 }}>
                已搁置
              </Tag>
            )}
          </div>

          {/* 任务内容统计 */}
          <div className={styles.statsGrid}>
            {hasDescription && (
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ background: '#eff6ff', color: '#3b82f6' }}>
                  <FileTextOutlined />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>包含描述</span>
                  <span className={styles.statValue}>
                    {task.description.length} 字符
                  </span>
                </div>
              </div>
            )}

            {imageCount > 0 && (
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ background: '#f0fdf4', color: '#10b981' }}>
                  <FileImageOutlined />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>关联图片</span>
                  <span className={styles.statValue}>{imageCount} 张</span>
                </div>
              </div>
            )}

            {checkListCount > 0 && (
              <div className={styles.statItem}>
                <div className={styles.statIcon} style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <CheckSquareOutlined />
                </div>
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>检查清单</span>
                  <span className={styles.statValue}>
                    {completedCheckCount}/{checkListCount} 项
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 任务描述预览（如果有） */}
          {hasDescription && (
            <div className={styles.descriptionPreview}>
              <div className={styles.descriptionLabel}>任务描述：</div>
              <div className={styles.descriptionText}>
                {task.description.length > 100 
                  ? `${task.description.substring(0, 100)}...` 
                  : task.description
                }
              </div>
            </div>
          )}

          {/* 图片预览网格（如果有） */}
          {imageCount > 0 && (
            <div className={styles.imagesSection}>
              <div className={styles.imagesSectionHeader}>
                <FileImageOutlined className={styles.imagesSectionIcon} />
                <span className={styles.imagesSectionTitle}>
                  关联图片 ({imageCount})
                </span>
              </div>
              <div className={styles.imagesGridWrapper}>
                <div className={styles.imagesGrid}>
                  {task.images?.map((image, index) => (
                    <div 
                      key={index} 
                      className={styles.imageItem}
                      onClick={() => handleImageClick(image, index)}
                    >
                      <TaskImage 
                        src={image} 
                        alt={`图片 ${index + 1}`}
                        className={styles.imageThumb}
                      />
                      <div className={styles.imageOverlay}>
                        <EyeOutlined className={styles.imageOverlayIcon} />
                        <span className={styles.imageOverlayText}>查看</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Divider style={{ margin: '20px 0' }} />

        {/* 警告信息 */}
        <Alert
          message="删除后将无法恢复"
          description={
            <div className={styles.warningContent}>
              <p>• 任务的所有信息将被永久删除</p>
              {imageCount > 0 && <p>• {imageCount} 张关联图片将被清除</p>}
              {checkListCount > 0 && <p>• {checkListCount} 项检查清单将被清除</p>}
              {hasDescription && <p>• 任务描述内容将被清除</p>}
            </div>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className={styles.warningAlert}
        />

        {/* 危险提示 */}
        <Alert
          message="此操作无法撤销"
          type="error"
          showIcon
          className={styles.dangerAlert}
        />
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <Modal
          open={!!previewImage}
          onCancel={handleClosePreview}
          footer={null}
          width="80vw"
          centered
          zIndex={1200}
          styles={{
            body: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
              position: 'relative',
              padding: 24
            }
          }}
        >
          <div style={{ textAlign: 'center', width: '100%' }}>
            <TaskImage
              src={previewImage}
              alt={`预览图片 ${previewIndex + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 8
              }}
            />
            {imageCount > 1 && (
              <div style={{
                marginTop: 16,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 16
              }}>
                <button
                  onClick={handlePrevImage}
                  style={{
                    padding: '8px 16px',
                    background: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  上一张
                </button>
                <span style={{ color: '#8c8c8c', fontSize: 14 }}>
                  {previewIndex + 1} / {imageCount}
                </span>
                <button
                  onClick={handleNextImage}
                  style={{
                    padding: '8px 16px',
                    background: '#1890ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  下一张
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  )
}
