/**
 * 模块分组组件
 * 
 * 功能说明:
 * - 用于按模块对任务进行分组展示
 * - 支持折叠/展开模块内容
 * - 支持编辑模块名称(仅待办任务模块)
 * - 显示模块内任务数量徽章
 * - 包含该模块下的所有任务卡片
 * - 支持收起状态下的拖拽排序（仅待办任务）
 * - 使用 Ant Design Collapse 组件实现
 * 
 * 使用场景:
 * - 在任务管理视图中按模块组织任务
 * - 区分待办任务和已完成任务的模块
 */
import React from 'react'
import { Collapse, Input, Button, Space, Badge } from 'antd'
import { CaretRightOutlined, EditOutlined, CheckOutlined, CloseOutlined, PlusOutlined, HolderOutlined } from '@ant-design/icons'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import TaskCard from './TaskCard'

export default function ModuleGroup({
  moduleName,
  tasks,
  status,
  isCollapsed,
  isEditing,
  editingName,
  taskTypeColors = {},
  onToggleCollapse,
  onStartEdit,
  onEditNameChange,
  onSaveEdit,
  onCancelEdit,
  onTaskComplete,
  onTaskRollback,
  onTaskEdit,
  onTaskDelete,
  onImageClick,
  onQuickAddTask,
  onEditTaskModule,
  onTaskShelve,
  onCheckItemChange,
  sortableId,
  isDraggable = false
}) {
  const isCompleted = status === 'completed'

  // 拖拽排序相关
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: sortableId || moduleName, 
    disabled: !isDraggable || !isCollapsed 
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const items = [
    {
      key: '1',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          {isEditing ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
              <Input
                value={editingName}
                onChange={(e) => onEditNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit()
                  } else if (e.key === 'Escape') {
                    onCancelEdit()
                  }
                }}
                autoFocus
                size="middle"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                size="middle"
                icon={<CheckOutlined />}
                onClick={onSaveEdit}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderColor: '#10b981'
                }}
              >
                确认
              </Button>
              <Button
                size="middle"
                icon={<CloseOutlined />}
                onClick={onCancelEdit}
              >
                取消
              </Button>
            </div>
          ) : (
            <>
              {/* 拖拽手柄 - 仅在收起状态且可拖拽时显示 */}
              {isDraggable && isCollapsed && (
                <HolderOutlined
                  {...attributes}
                  {...listeners}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: 16,
                    color: '#94a3b8',
                    cursor: 'move',
                    padding: '4px',
                    marginLeft: -4
                  }}
                />
              )}
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {moduleName}
                <Badge
                  count={tasks.length}
                  style={{
                    marginLeft: 8,
                    backgroundColor: isCompleted ? '#10b981' : '#f59e0b',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </span>
              {!isCompleted && (
                <>
                  <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      onQuickAddTask(moduleName)
                    }}
                    title="快速添加任务"
                    style={{ color: '#3b82f6' }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartEdit()
                    }}
                    title="编辑模块名"
                    style={{ color: '#64748b' }}
                  />
                </>
              )}
            </>
          )}
        </div>
      ),
      children: (
        <>
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleted={isCompleted}
              taskTypeColors={taskTypeColors}
              onComplete={onTaskComplete}
              onRollback={onTaskRollback}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
              onImageClick={onImageClick}
              onEditModule={onEditTaskModule}
              onShelve={onTaskShelve}
              onCheckItemChange={onCheckItemChange}
            />
          ))}
        </>
      )
    }
  ]

  return (
    <div ref={setNodeRef} style={{ marginBottom: 16, ...sortableStyle }}>
      <Collapse
        activeKey={isCollapsed ? [] : ['1']}
        onChange={onToggleCollapse}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          boxShadow: isDragging ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 2px rgba(0, 0, 0, 0.05)'
        }}
        items={items}
      />
    </div>
  )
}
