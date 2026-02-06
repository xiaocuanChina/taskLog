/**
 * 删除项目确认模态框组件 - 现代化设计
 * 
 * 设计理念:
 * - 复用通用删除确认组件
 * - 展示项目详细信息和统计数据
 * - 清晰的警告层次
 */
import React from 'react'
import { 
  FolderOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileImageOutlined,
  AppstoreOutlined
} from '@ant-design/icons'
import DeleteConfirmModal from '../common/DeleteConfirmModal'
import styles from './DeleteProjectModal.module.css'

export default function DeleteProjectModal({ 
  show, 
  project,
  projectStats,
  onConfirm, 
  onCancel 
}) {
  if (!project) return null

  const stats = projectStats || {
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalModules: 0,
    totalImages: 0
  }

  // 构建警告项列表
  const warningItems = [
    '只有完成所有任务的项目才能删除',
    '删除后项目下的所有数据将被永久清除',
    '包括：已完成任务、任务模块、关联图片'
  ]

  return (
    <DeleteConfirmModal
      show={show}
      title="确认删除项目"
      width={520}
      onConfirm={onConfirm}
      onCancel={onCancel}
      warningTitle="删除限制"
      warningItems={warningItems}
    >
      {/* 项目信息卡片 */}
      <div className={styles.projectCard}>
        <div className={styles.projectHeader}>
          <div className={styles.projectIcon}>
            <FolderOutlined />
          </div>
          <div className={styles.projectInfo}>
            <h3 className={styles.projectName}>{project.name}</h3>
            <span className={styles.projectDate}>
              创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* 项目统计 */}
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <CheckCircleOutlined className={styles.statIcon} style={{ color: '#52c41a' }} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.completedTasks}</span>
              <span className={styles.statLabel}>已完成任务</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <ClockCircleOutlined className={styles.statIcon} style={{ color: '#faad14' }} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.pendingTasks}</span>
              <span className={styles.statLabel}>进行中任务</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <AppstoreOutlined className={styles.statIcon} style={{ color: '#1890ff' }} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalModules}</span>
              <span className={styles.statLabel}>任务模块</span>
            </div>
          </div>

          <div className={styles.statItem}>
            <FileImageOutlined className={styles.statIcon} style={{ color: '#722ed1' }} />
            <div className={styles.statContent}>
              <span className={styles.statValue}>{stats.totalImages}</span>
              <span className={styles.statLabel}>关联图片</span>
            </div>
          </div>
        </div>
      </div>
    </DeleteConfirmModal>
  )
}
