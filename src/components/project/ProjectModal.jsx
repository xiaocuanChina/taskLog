/**
 * 项目创建/编辑模态框组件
 * 
 * 功能说明:
 * - 用于创建新项目或编辑现有项目
 * - 提供项目名称输入框
 * - 支持回车键快速确认
 * - 根据 isEdit 参数区分创建和编辑模式
 * - 使用 Ant Design Modal 和 Form 组件实现
 * 
 * 使用场景:
 * - 在项目选择视图中创建新项目
 * - 编辑现有项目的名称
 */
import React from 'react'
import { Modal, Input, Form } from 'antd'
export default function ProjectModal({ show, isEdit, projectName, onNameChange, onConfirm, onCancel }) {
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
      title={isEdit ? '编辑项目' : '创建新项目'}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={isEdit ? '确认更新' : '确认创建'}
      cancelText="取消"
      centered
    >
      <Form layout="vertical">
        <Form.Item label="项目名称" required>
          <Input
            placeholder="请输入项目名称"
            value={projectName}
            onChange={(e) => onNameChange(e.target.value)}
            onPressEnter={onConfirm}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
