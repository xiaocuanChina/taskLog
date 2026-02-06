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
import { Modal, Input, Button, Space, Tag, Empty, Popconfirm, Tooltip, Tabs } from 'antd'
import { FolderOutlined, EditOutlined, DeleteOutlined, BorderOuterOutlined, LoginOutlined, CheckOutlined, CloseOutlined, HolderOutlined, UnorderedListOutlined, PlusOutlined } from '@ant-design/icons'
import RecycleBin from './RecycleBin'
import { useToast } from '../../context/ToastContext'
import styles from './EditModuleListModal.module.css'
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
    opacity: isDragging ? 0.5 : 1,
  }

  const completedCount = taskCount - pendingTaskCount

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`${styles.moduleItem} ${isDragging ? styles.dragging : ''} ${isEditing ? styles.editing : ''}`}
    >
      <div className={styles.moduleItemContent}>
        {/* 拖拽手柄 */}
        {!isEditing && (
          <div 
            className={styles.dragHandle}
            {...attributes}
            {...listeners}
          >
            <HolderOutlined />
          </div>
        )}

        {/* 模块图标 */}
        <div className={styles.moduleIcon}>
          <FolderOutlined />
        </div>

        {isEditing ? (
          // 编辑模式
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
              className={styles.editInput}
              placeholder="输入模块名称"
            />
            <div className={styles.editActions}>
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
            </div>
          </>
        ) : (
          // 查看模式
          <>
            <div className={styles.moduleInfo}>
              <div className={styles.moduleName} title={module.name}>
                {module.name}
              </div>
              <div className={styles.moduleStats}>
                <Tag 
                  color={pendingTaskCount > 0 ? 'orange' : 'default'} 
                  className={styles.statTag}
                >
                  待办 {pendingTaskCount}
                </Tag>
                <Tag 
                  color={completedCount > 0 ? 'green' : 'default'}
                  className={styles.statTag}
                >
                  已完成 {completedCount}
                </Tag>
              </div>
            </div>

            <div className={styles.moduleActions}>
              <Tooltip title="编辑模块名称">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={onStartEdit}
                  className={styles.actionBtn}
                />
              </Tooltip>

              {/* 移入回收站 */}
              {pendingTaskCount === 0 ? (
                <Popconfirm
                  title="确认移入回收站"
                  description={
                    <div>
                      <p>确定要将模块 <strong>"{module.name}"</strong> 移入回收站吗？</p>
                      {completedCount > 0 && (
                        <p style={{ color: '#faad14', marginTop: 8 }}>
                          该模块包含 {completedCount} 个已完成任务
                        </p>
                      )}
                    </div>
                  }
                  onConfirm={() => onDelete(module.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Tooltip title="移入回收站">
                    <Button
                      type="text"
                      size="small"
                      icon={<LoginOutlined />}
                      className={`${styles.actionBtn} ${styles.recycleBtn}`}
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
                    className={styles.actionBtn}
                  />
                </Tooltip>
              )}

              {/* 永久删除 */}
              {taskCount === 0 ? (
                <Popconfirm
                  title="确认永久删除"
                  description={
                    <div>
                      <p>确定要永久删除模块 <strong>"{module.name}"</strong> 吗？</p>
                      <p style={{ color: '#ff4d4f', marginTop: 8 }}>
                        ⚠️ 此操作不可恢复！
                      </p>
                    </div>
                  }
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
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
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
                    className={styles.actionBtn}
                  />
                </Tooltip>
              )}
            </div>
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
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FolderOutlined className={styles.titleIcon} />
            <span>模块管理</span>
          </div>
          {view === 'list' && !showAddInput && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setShowAddInput(true)}
              className={styles.addBtn}
            >
              新建模块
            </Button>
          )}
        </div>
      }
      open={show}
      onCancel={onClose}
      footer={null}
      width={680}
      className={styles.modal}
    >
      {/* 标签页切换 */}
      <Tabs
        activeKey={view}
        onChange={(key) => {
          setView(key)
          setShowAddInput(false)
          setNewModuleName('')
        }}
        className={styles.viewTabs}
        items={[
          {
            key: 'list',
            label: (
              <div className={styles.tabLabel}>
                <UnorderedListOutlined className={styles.tabIcon} />
                <span>模块列表</span>
                {localModules.length > 0 && (
                  <span className={styles.tabBadge}>{localModules.length}</span>
                )}
              </div>
            ),
            children: (
              <div className={styles.modalBody}>
                {/* 新增模块输入区域 */}
                {showAddInput && (
                  <div className={styles.addModuleSection}>
                    <div className={styles.addModuleContent}>
                      <div className={styles.addModuleIcon}>
                        <PlusOutlined />
                      </div>
                      <Input
                        ref={newModuleInputRef}
                        placeholder="输入新模块名称，按 Enter 确认"
                        value={newModuleName}
                        onChange={(e) => setNewModuleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddModule()
                          } else if (e.key === 'Escape') {
                            handleCancelAdd()
                          }
                        }}
                        className={styles.addModuleInput}
                      />
                      <div className={styles.addModuleActions}>
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={handleAddModule}
                          loading={isAdding}
                          size="small"
                        >
                          确认
                        </Button>
                        <Button
                          icon={<CloseOutlined />}
                          onClick={handleCancelAdd}
                          size="small"
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 模块列表 */}
                {localModules.length === 0 ? (
                  <Empty 
                    description="暂无模块，点击上方按钮创建第一个模块"
                    className={styles.emptyState}
                  />
                ) : (
                  <div className={styles.moduleList}>
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
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'recycle',
            label: (
              <div className={styles.tabLabel}>
                <DeleteOutlined className={styles.tabIcon} />
                <span>回收站</span>
                {recycleModules.length > 0 && (
                  <span className={`${styles.tabBadge} ${styles.recycleBadge}`}>
                    {recycleModules.length}
                  </span>
                )}
              </div>
            ),
            children: (
              <div className={styles.modalBody}>
                <div className={styles.recycleBinView}>
                  {recycleModules.length > 0 ? (
                    <RecycleBin modules={recycleModules} onRestore={onRestoreModule} />
                  ) : (
                    <Empty 
                      description="回收站为空"
                      className={styles.emptyState}
                    />
                  )}
                </div>
              </div>
            ),
          },
        ]}
      />

      {/* 底部操作栏 */}
      <div className={styles.modalFooter}>
        <Button type="primary" onClick={onClose} size="large">
          完成
        </Button>
      </div>
    </Modal>
  )
}
