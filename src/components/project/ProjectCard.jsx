/**
 * 项目卡片组件
 * 
 * 功能说明:
 * - 用于在项目选择视图中展示单个项目
 * - 显示项目名称、图标和创建时间
 * - 提供编辑和删除项目的快捷按钮
 * - 点击卡片可进入项目的任务管理界面
 * - 使用 Ant Design Card 组件实现
 * 
 * 使用场景:
 * - 项目选择视图中的项目列表展示
 */
import React from 'react'
import { Card, Button, Space } from 'antd'
import { EditOutlined, DeleteOutlined, FolderOutlined, HolderOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function ProjectCard({ project, onSelect, onEdit, onDelete }) {
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
            <Button 
              type="text" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(project)}
              title="编辑项目"
            />
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
          <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px 0' }}>{project.name}</h3>
          <p style={{ color: '#8c8c8c', fontSize: 13, margin: 0 }}>
            创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </Card>
    </div>
  )
}
