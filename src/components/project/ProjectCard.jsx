/**
 * 项目卡片组件
 * 
 * 功能说明:
 * - 用于在项目选择视图中展示单个项目
 * - 显示项目名称、图标和创建时间
 * - 提供编辑和删除项目的快捷按钮
 * - 点击卡片可进入项目的任务管理界面
 * - 支持行内编辑项目名称
 * - 使用 Ant Design Card 组件实现
 * 
 * 使用场景:
 * - 项目选择视图中的项目列表展示
 */
import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Space, Input } from 'antd'
import { EditOutlined, DeleteOutlined, FolderOutlined, HolderOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function ProjectCard({ project, onSelect, onUpdateName, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(project.name)
  const inputRef = useRef(null)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    height: '100%',
  }

  // 进入编辑模式时自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // 开始编辑
  const handleStartEdit = (e) => {
    e.stopPropagation()
    setEditName(project.name)
    setIsEditing(true)
  }

  // 确认保存
  const handleConfirm = (e) => {
    e?.stopPropagation()
    const trimmedName = editName.trim()
    if (trimmedName && trimmedName !== project.name) {
      onUpdateName(project.id, trimmedName)
    }
    setIsEditing(false)
  }

  // 取消编辑
  const handleCancel = (e) => {
    e?.stopPropagation()
    setEditName(project.name)
    setIsEditing(false)
  }

  // 处理键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleConfirm(e)
    } else if (e.key === 'Escape') {
      handleCancel(e)
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        hoverable
        style={{ height: '100%', cursor: isDragging ? 'grabbing' : 'pointer' }}
        onClick={() => onSelect(project)}
        extra={
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Button 
              type="text" 
              size="small"
              icon={<HolderOutlined />}
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab' }}
              title="拖拽排序"
            />
            {isEditing ? (
              <>
                <Button 
                  type="text" 
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={handleConfirm}
                  title="确认"
                  style={{ color: '#52c41a' }}
                />
                <Button 
                  type="text" 
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  title="取消"
                />
              </>
            ) : (
              <Button 
                type="text" 
                size="small"
                icon={<EditOutlined />}
                onClick={handleStartEdit}
                title="编辑项目"
              />
            )}
            <Button 
              type="text" 
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(project)}
              title="删除项目"
            />
          </Space>
        }
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <FolderOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleConfirm}
              onClick={(e) => e.stopPropagation()}
              style={{ 
                fontSize: 18, 
                fontWeight: 600, 
                textAlign: 'center',
                marginBottom: 8
              }}
              maxLength={50}
            />
          ) : (
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0' }}>{project.name}</h3>
          )}
          <p style={{ color: '#8c8c8c', fontSize: 13, margin: 0 }}>
            创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </Card>
    </div>
  )
}
