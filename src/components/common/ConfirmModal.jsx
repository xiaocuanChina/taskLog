/**
 * 确认删除模态框组件
 * 
 * 功能说明:
 * - 用于显示删除确认对话框
 * - 支持自定义标题、消息和警告信息
 * - 使用 Ant Design Modal 组件实现
 * - 提供确认和取消操作
 * 
 * 使用场景:
 * - 删除项目时的二次确认
 * - 删除任务时的二次确认
 * - 其他需要用户确认的危险操作
 */
import React from 'react'
import { Modal } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
export default function ConfirmModal({ show, title, message, warning, onConfirm, onCancel }) {
  return (
    <Modal
      open={show}
      title={<span><ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />{title}</span>}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ danger: true }}
      centered
    >
      <p style={{ marginBottom: warning ? 12 : 0 }}>{message}</p>
      {warning && (
        <p style={{ 
          color: '#ff4d4f', 
          backgroundColor: '#fff2f0', 
          padding: '8px 12px', 
          borderRadius: 4,
          fontSize: 13,
          margin: 0
        }}>
          {warning}
        </p>
      )}
    </Modal>
  )
}
