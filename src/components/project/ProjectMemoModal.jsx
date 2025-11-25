/**
 * 项目备忘编辑模态框组件
 * 
 * 功能说明:
 * - 用于编辑项目的备忘信息
 * - 提供多行文本输入框
 * - 支持添加和修改项目备忘内容
 * - 使用 Ant Design Modal 和 Form 组件实现
 * 
 * 使用场景:
 * - 为项目添加备忘信息
 * - 修改已有的项目备忘内容
 * - 记录项目相关的重要信息和注意事项
 */
import React from 'react'
import { Modal, Input, Form } from 'antd'

const { TextArea } = Input
export default function ProjectMemoModal({ show, memo, projectName, onMemoChange, onConfirm, onCancel }) {
  // 处理键盘事件，支持 Ctrl+S 保存
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <Modal
      open={show}
      title={`📝 项目备忘 - ${projectName}`}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认保存"
      cancelText="取消"
      centered
      width={600}
    >
      <Form layout="vertical">
        <Form.Item label="备忘内容">
          <TextArea
            placeholder="请输入项目备忘信息..."
            value={memo}
            onChange={(e) => onMemoChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={6}
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
