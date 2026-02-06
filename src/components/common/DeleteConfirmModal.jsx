/**
 * 通用删除确认模态框组件 - 现代化设计
 * 
 * 设计理念:
 * - 可复用的删除确认对话框
 * - 支持自定义内容区域
 * - 统一的视觉风格和交互体验
 * - 清晰的警告层次
 */
import React from 'react'
import { Modal, Alert, Divider } from 'antd'
import { 
  ExclamationCircleOutlined, 
  DeleteOutlined
} from '@ant-design/icons'
import styles from './DeleteConfirmModal.module.css'

export default function DeleteConfirmModal({ 
  show,
  title = '确认删除',
  width = 540,
  onConfirm, 
  onCancel,
  children,
  warningTitle = '删除后将无法恢复',
  warningItems = [],
  dangerMessage = '此操作无法撤销'
}) {
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
      width={width}
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
        <h2 className={styles.title}>{title}</h2>

        {/* 自定义内容区域 */}
        {children}

        <Divider style={{ margin: '20px 0' }} />

        {/* 警告信息 */}
        {warningItems.length > 0 && (
          <Alert
            message={warningTitle}
            description={
              <div className={styles.warningContent}>
                {warningItems.map((item, index) => (
                  <p key={index}>• {item}</p>
                ))}
              </div>
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            className={styles.warningAlert}
          />
        )}

        {/* 危险提示 */}
        <Alert
          message={dangerMessage}
          type="error"
          showIcon
          className={styles.dangerAlert}
        />
      </div>
    </Modal>
  )
}
