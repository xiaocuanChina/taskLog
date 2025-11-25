/**
 * 编辑模块列表模态框组件
 * 
 * 功能说明:
 * - 用于批量管理当前项目的所有模块
 * - 支持查看所有模块及其任务数量
 * - 支持编辑模块名称
 * - 支持删除空模块
 * - 支持拖拽排序模块（使用 @dnd-kit）
 * - 使用 Ant Design Modal 组件实现
 * 
 * 使用场景:
 * - 在任务管理界面点击"编辑模块"按钮时弹出
 * - 统一管理项目的模块结构
 */
import React, { useState, useEffect } from 'react'
import { Modal, Input, Button, Space, Tag, Empty, Popconfirm, Tooltip, Radio } from 'antd'
import { FolderOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, HolderOutlined, UnorderedListOutlined } from '@ant-design/icons'
import RecycleBin from './RecycleBin'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// 可排序的模块项组件
function SortableModuleItem({ 
  module, 
  taskCount,
  pendingTaskCount,
  isEditing, 
  editingName,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditNameChange,
  onDelete
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id, disabled: isEditing })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px 16px',
    background: isDragging ? '#e6f7ff' : '#fafafa',
    marginBottom: 8,
    borderRadius: 8,
    cursor: isEditing ? 'default' : 'move',
    border: '1px solid #f0f0f0',
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
        {!isEditing && (
          <HolderOutlined 
            {...attributes}
            {...listeners}
            style={{ 
              fontSize: 16, 
              color: '#8c8c8c',
              cursor: 'move'
            }} 
          />
        )}
        <FolderOutlined style={{ fontSize: 18, color: '#1890ff' }} />
        
        {isEditing ? (
          <>
            <Input
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onSaveEdit(module.id)
                } else if (e.key === 'Escape') {
                  onCancelEdit()
                }
              }}
              autoFocus
              style={{ flex: 1 }}
            />
            <Button 
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => onSaveEdit(module.id)}
            >
              保存
            </Button>
            <Button 
              size="small"
              icon={<CloseOutlined />}
              onClick={onCancelEdit}
            >
              取消
            </Button>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{module.name}</span>
              <Tag color={taskCount > 0 ? 'blue' : 'default'}>
                {taskCount} 个任务
              </Tag>
            </div>
            <Space>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={onStartEdit}
              >
                编辑
              </Button>
              {pendingTaskCount === 0 ? (
                <Popconfirm
                  title="确认移入回收站"
                  description={`确定要将模块"${module.name}"移入回收站吗？`}
                  onConfirm={() => onDelete(module.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    移入回收站
                  </Button>
                </Popconfirm>
              ) : (
                <Tooltip title="该模块下还有待办任务，无法移入回收站">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled
                  >
                    移入回收站
                  </Button>
                </Tooltip>
              )}
            </Space>
          </>
        )}
      </div>
    </div>
  )
}

export default function EditModuleListModal({ 
  show, 
  modules = [], 
  recycleModules = [],
  tasks = [],
  onUpdateModule,
  onDeleteModule,
  onRestoreModule,
  onReorderModules,
  onClose 
}) {
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [localModules, setLocalModules] = useState([])
  const [view, setView] = useState('list') // 'list' | 'recycle'

  // 配置传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 当模块列表变化时更新本地状态
  useEffect(() => {
    setLocalModules([...modules])
  }, [modules])

  // 计算每个模块的任务数量
  const getModuleTaskCount = (moduleName) => {
    return tasks.filter(task => task.module === moduleName).length
  }

  // 计算每个模块的待办任务数量
  const getModulePendingTaskCount = (moduleName) => {
    return tasks.filter(task => task.module === moduleName && !task.completed).length
  }

  // 开始编辑模块
  const handleStartEdit = (module) => {
    setEditingModuleId(module.id)
    setEditingName(module.name)
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingModuleId(null)
    setEditingName('')
  }

  // 保存编辑
  const handleSaveEdit = (moduleId) => {
    if (!editingName.trim()) {
      return
    }
    onUpdateModule(moduleId, editingName.trim())
    handleCancelEdit()
  }

  // 删除模块
  const handleDelete = (moduleId) => {
    onDeleteModule(moduleId)
  }

  // 拖拽结束处理
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localModules.findIndex(m => m.id === active.id)
      const newIndex = localModules.findIndex(m => m.id === over.id)

      const newModules = arrayMove(localModules, oldIndex, newIndex)
      setLocalModules(newModules)
      
      // 自动保存新的排序
      onReorderModules(newModules)
    }
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginRight: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOutlined />
            <span>{view === 'list' ? '编辑模块列表' : '模块回收站'}</span>
          </div>
          <Radio.Group 
            value={view} 
            onChange={e => setView(e.target.value)}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="list">
              <Space size={4}>
                 <UnorderedListOutlined />
                 列表
              </Space>
            </Radio.Button>
            <Radio.Button value="recycle">
              <Space size={4}>
                 <DeleteOutlined />
                 回收站
                 {recycleModules.length > 0 && <span style={{ fontSize: 12 }}>({recycleModules.length})</span>}
              </Space>
            </Radio.Button>
          </Radio.Group>
        </div>
      }
      open={show}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
      width={600}
    >
      <div style={{ padding: '16px 0' }}>
        {view === 'list' ? (
          localModules.length === 0 ? (
            <Empty description="暂无模块" />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localModules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {localModules.map((module) => {
                  const taskCount = getModuleTaskCount(module.name)
                  const pendingTaskCount = getModulePendingTaskCount(module.name)
                  const isEditing = editingModuleId === module.id

                  return (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      taskCount={taskCount}
                      pendingTaskCount={pendingTaskCount}
                      isEditing={isEditing}
                      editingName={editingName}
                      onStartEdit={() => handleStartEdit(module)}
                      onCancelEdit={handleCancelEdit}
                      onSaveEdit={handleSaveEdit}
                      onEditNameChange={setEditingName}
                      onDelete={handleDelete}
                    />
                  )
                })}
              </SortableContext>
            </DndContext>
          )
        ) : (
          recycleModules.length > 0 ? (
            <RecycleBin modules={recycleModules} onRestore={onRestoreModule} />
          ) : (
            <Empty description="回收站为空" />
          )
        )}
      </div>
    </Modal>
  )
}
