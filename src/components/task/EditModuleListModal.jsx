/**
 * 编辑模块列表模态框组件
 *
 * 功能说明:
 * - 用于批量管理当前项目的所有模块
 * - 支持查看所有模块及其任务数量
 * - 支持编辑模块名称
 * - 支持将空模块移入回收站
 * - 支持永久删除空模块（无待办任务时可删除）
 * - 支持拖拽排序模块（使用 @dnd-kit）
 * - 使用 Ant Design Modal 组件实现
 *
 * 使用场景:
 * - 在任务管理界面点击"编辑模块"按钮时弹出
 * - 统一管理项目的模块结构
 */
import React, { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, Space, Tag, Empty, Popconfirm, Tooltip, Radio } from 'antd'
import { FolderOutlined, EditOutlined, DeleteOutlined, BorderOuterOutlined, LoginOutlined, CheckOutlined, CloseOutlined, HolderOutlined, UnorderedListOutlined, PlusOutlined } from '@ant-design/icons'
import RecycleBin from './RecycleBin'
import { useToast } from '../../context/ToastContext'
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
  onDelete,
  onPermanentDelete
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
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={module.name}
              >
                {module.name}
              </span>
              <Tag color={pendingTaskCount > 0 ? 'orange' : 'default'} style={{ flexShrink: 0 }}>
                待办 {pendingTaskCount}
              </Tag>
              <Tag color={taskCount - pendingTaskCount > 0 ? 'green' : 'default'} style={{ flexShrink: 0 }}>
                已完成 {taskCount - pendingTaskCount}
              </Tag>
            </div>
            <Space>
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={onStartEdit}
                />
              </Tooltip>
              {/* 移入回收站：待办任务数为0时可用 */}
              {pendingTaskCount === 0 ? (
                <Popconfirm
                  title="确认移入回收站"
                  description={`确定要将模块"${module.name}"移入回收站吗？`}
                  onConfirm={() => onDelete(module.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Tooltip title="移入回收站">
                    <Button
                      type="text"
                      size="small"
                      style={{ color: '#d59310' }}
                      icon={<LoginOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              ) : (
                <Tooltip title="该模块下还有待办任务，无法移入回收站">
                  <Button
                    type="text"
                    size="small"
                    icon={<LoginOutlined />}
                    disabled
                  />
                </Tooltip>
              )}
              {/* 永久删除：任务总数为0时可用 */}
              {taskCount === 0 ? (
                <Popconfirm
                  title="确认永久删除"
                  description={`确定要永久删除模块"${module.name}"吗？此操作不可恢复！`}
                  onConfirm={() => onPermanentDelete(module.id)}
                  okText="确认删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Tooltip title="永久删除">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Tooltip>
                </Popconfirm>
              ) : (
                <Tooltip title="该模块下还有任务，无法永久删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    disabled
                  />
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
  onPermanentDeleteModule,
  onRestoreModule,
  onReorderModules,
  onAddModule,
  onClose
}) {
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [localModules, setLocalModules] = useState([])
  const [view, setView] = useState('list') // 'list' | 'recycle'
  const [newModuleName, setNewModuleName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const newModuleInputRef = useRef(null)
  const showToast = useToast()

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

  // 显示添加输入框时自动聚焦
  useEffect(() => {
    if (showAddInput && newModuleInputRef.current) {
      setTimeout(() => {
        newModuleInputRef.current.focus()
      }, 100)
    }
  }, [showAddInput])

  // 新增模块
  const handleAddModule = async () => {
    if (!newModuleName.trim()) {
      showToast('请输入模块名称', 'warning')
      return
    }
    // 检查是否已存在同名模块
    const exists = localModules.some(m => m.name === newModuleName.trim())
    if (exists) {
      showToast('该模块名称已存在', 'warning')
      return
    }
    setIsAdding(true)
    try {
      await onAddModule(newModuleName.trim())
      setNewModuleName('')
      setShowAddInput(false)
      showToast('模块添加成功')
    } catch (error) {
      showToast('模块添加失败', 'error')
    } finally {
      setIsAdding(false)
    }
  }

  // 取消添加
  const handleCancelAdd = () => {
    setNewModuleName('')
    setShowAddInput(false)
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

  // 删除模块（移入回收站）
  const handleDelete = (moduleId) => {
    onDeleteModule(moduleId)
  }

  // 永久删除模块
  const handlePermanentDelete = (moduleId) => {
    onPermanentDeleteModule(moduleId)
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
          <Space size={8}>
            {view === 'list' && !showAddInput && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setShowAddInput(true)}
              >
                添加
              </Button>
            )}

            <Radio.Group
              value={view}
              onChange={e => {
                setView(e.target.value)
                setShowAddInput(false)
                setNewModuleName('')
              }}
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
          </Space>
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
          <>
            {/* 新增模块输入区域 - 点击添加按钮后显示 */}
            {showAddInput && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 16,
                padding: '12px 16px',
                background: '#f5f5f5',
                borderRadius: 8,
                border: '1px dashed #1890ff'
              }}>
                <Input
                  ref={newModuleInputRef}
                  placeholder="输入新模块名称"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddModule()
                    } else if (e.key === 'Escape') {
                      handleCancelAdd()
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleAddModule}
                  loading={isAdding}
                >
                  确认
                </Button>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancelAdd}
                >
                  取消
                </Button>
              </div>
            )}

            {localModules.length === 0 ? (
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
                        onPermanentDelete={handlePermanentDelete}
                      />
                    )
                  })}
                </SortableContext>
              </DndContext>
            )}
          </>
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
