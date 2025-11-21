/**
 * 编辑任务模块模态框组件
 * 
 * 功能说明:
 * - 用于修改任务所属的模块
 * - 支持从现有模块列表中选择
 * - 支持输入新的模块名称
 * - 使用 Ant Design Modal 组件实现
 * 
 * 使用场景:
 * - 在任务卡片中点击模块标签时弹出
 * - 快速调整任务的模块归属
 */
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Space, Tag } from 'antd'
import { FolderOutlined, PlusOutlined } from '@ant-design/icons'

export default function EditTaskModuleModal({ 
  show, 
  task, 
  modules = [], 
  onConfirm, 
  onCancel 
}) {
  const [selectedModule, setSelectedModule] = useState('')
  const [isCustomInput, setIsCustomInput] = useState(false)

  useEffect(() => {
    if (show && task) {
      setSelectedModule(task.module || '')
      setIsCustomInput(false)
    }
  }, [show, task])

  const handleConfirm = () => {
    if (!selectedModule.trim()) {
      return
    }
    onConfirm(task.id, selectedModule.trim())
  }

  const handleModuleSelect = (moduleName) => {
    setSelectedModule(moduleName)
    setIsCustomInput(false)
  }

  const handleCustomInput = () => {
    setIsCustomInput(true)
    setSelectedModule('')
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOutlined />
          <span>修改任务模块</span>
        </div>
      }
      open={show}
      onOk={handleConfirm}
      onCancel={onCancel}
      okText="确认"
      cancelText="取消"
      width={500}
      okButtonProps={{ disabled: !selectedModule.trim() }}
    >
      <div style={{ padding: '16px 0' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            任务名称：{task?.name}
          </div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>
            当前模块：{task?.module || '未分类'}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            选择模块：
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {modules.map(module => (
              <Tag
                key={module.id}
                color={selectedModule === module.name && !isCustomInput ? 'blue' : 'default'}
                style={{ 
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '4px 12px',
                  margin: 0
                }}
                onClick={() => handleModuleSelect(module.name)}
              >
                {module.name}
              </Tag>
            ))}
            <Tag
              icon={<PlusOutlined />}
              color={isCustomInput ? 'blue' : 'default'}
              style={{ 
                cursor: 'pointer',
                fontSize: 13,
                padding: '4px 12px',
                margin: 0
              }}
              onClick={handleCustomInput}
            >
              自定义
            </Tag>
          </div>
        </div>

        {isCustomInput && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              输入新模块名：
            </div>
            <Input
              placeholder="请输入模块名称"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              onPressEnter={handleConfirm}
              autoFocus
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
