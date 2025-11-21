/**
 * 模块分组组件
 * 
 * 功能说明:
 * - 用于按模块对任务进行分组展示
 * - 支持折叠/展开模块内容
 * - 支持编辑模块名称(仅待办任务模块)
 * - 显示模块内任务数量徽章
 * - 包含该模块下的所有任务卡片
 * - 使用 Ant Design Collapse 组件实现
 * 
 * 使用场景:
 * - 在任务管理视图中按模块组织任务
 * - 区分待办任务和已完成任务的模块
 */
import React from 'react'
import { Collapse, Input, Button, Space, Badge } from 'antd'
import { CaretRightOutlined, EditOutlined, CheckOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons'
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
  onEditTaskModule
}) {
  const isCompleted = status === 'completed'

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
              <span style={{ flex: 1 }}>
                📦 {moduleName}
                <Badge 
                  count={tasks.length} 
                  style={{ marginLeft: 8, backgroundColor: isCompleted ? '#52c41a' : '#1890ff' }}
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
            />
          ))}
        </>
      )
    }
  ]

  return (
    <div style={{ marginBottom: 16 }}>
      <Collapse
        activeKey={isCollapsed ? [] : ['1']}
        onChange={onToggleCollapse}
        expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
        style={{ background: '#fafafa' }}
        items={items}
      />
    </div>
  )
}
