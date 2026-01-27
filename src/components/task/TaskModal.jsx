/**
 * 任务添加/编辑模态框组件
 *
 * 功能说明:
 * - 用于添加新任务或编辑现有任务
 * - 提供任务描述、模块、类型、发起人、备注等字段输入
 * - 支持上传附件图片(拖拽、粘贴、选择文件)
 * - 支持添加代码块,带语言选择和语法高亮
 * - 模块名和任务类型支持自动补全
 * - 编辑模式下可管理已有图片和新增图片
 * - 使用 Ant Design Modal 和 Form 组件实现
 *
 * 使用场景:
 * - 在任务管理视图中添加新任务
 * - 编辑待办任务的信息
 */
import { useEffect, useRef, useState, useMemo } from 'react'
import { Modal, Input, Form, Row, Col, Button, Switch, AutoComplete, Space, Tag, Tree, Tooltip, Radio } from 'antd'
import { UploadOutlined, DeleteOutlined, CodeOutlined, EditOutlined, PlusOutlined, FileTextOutlined, HolderOutlined } from '@ant-design/icons'
import TaskImage from '../common/TaskImage'
import styles from './TaskModal.module.css'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-powershell'

const { TextArea } = Input

// 辅助函数：将平铺列表转换为树形结构
const buildTreeData = (items) => {
  const itemMap = {}
  const tree = []

  // 初始化每个节点
  items.forEach(item => {
    itemMap[item.id] = { ...item, key: item.id, value: item.id, title: item.name, remark: item.remark || '', children: [] }
  })

  // 构建树
  items.forEach(item => {
    if (item.parentId && itemMap[item.parentId]) {
      itemMap[item.parentId].children.push(itemMap[item.id])
    } else {
      tree.push(itemMap[item.id])
    }
  })

  return tree
}
export default function TaskModal({
  show,
  isEdit,
  task,
  modules,
  recycleModules = [],
  taskTypes = [],
  dragActive,
  onTaskChange,
  onModuleDropdownToggle,
  onTypeDropdownToggle,
  onModuleSelect,
  onTypeSelect,
  onImageChange,
  onRemoveImage,
  onRemoveExistingImage,
  onDrag,
  onDrop,
  onPaste,
  onConfirm,
  onCancel,
  onPreviewImage,
  refs
}) {
  // 使用 ref 追踪最新的 props，解决闭包旧值问题
  const latestProps = useRef({ task, onTaskChange })
  useEffect(() => {
    latestProps.current = { task, onTaskChange }
  }, [task, onTaskChange])

  // 勾选项名称重复错误状态
  const [checkItemError, setCheckItemError] = useState('')
  // 当前正在编辑的勾选项ID
  const [editingItemId, setEditingItemId] = useState(null)
  // 当前正在编辑备注的勾选项ID
  const [editingRemarkItemId, setEditingRemarkItemId] = useState(null)
  // 备注输入值
  const [remarkInputValue, setRemarkInputValue] = useState('')

  // Modal 关闭时清除错误状态和编辑状态
  useEffect(() => {
    if (!show) {
      setCheckItemError('')
      setEditingItemId(null)
    }
  }, [show])

  // 监听 Ctrl+S 快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (show) {
          // 如果正在编辑备注，先保存备注，不触发整个任务保存
          if (editingRemarkItemId) {
            const currentTask = latestProps.current.task
            const items = currentTask?.checkItems?.items || []
            const newItems = items.map(item => {
              if (item.id === editingRemarkItemId) {
                return { ...item, remark: remarkInputValue.trim() }
              }
              return item
            })
            const updatedTask = {
              ...currentTask,
              checkItems: {
                ...(currentTask?.checkItems || {}),
                items: newItems
              }
            }
            // 保存备注并退出编辑状态
            latestProps.current.onTaskChange(updatedTask)
            setEditingRemarkItemId(null)
            setRemarkInputValue('')
            // 只保存备注，不触发任务确认
            return
          }
          // 没有在编辑备注时，才触发任务保存
          onConfirm()
        }
      }
    }

    if (show) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [show, onConfirm, editingRemarkItemId, remarkInputValue])

  // Modal 打开时自动聚焦到任务描述输入框
  useEffect(() => {
    if (show && refs?.nameRef?.current) {
      // 使用 setTimeout 确保 Modal 完全渲染后再聚焦
      setTimeout(() => {
        refs.nameRef.current.focus()
      }, 100)
    }
  }, [show])
  const languages = [
    'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
    'go', 'rust', 'php', 'ruby', 'sql', 'html', 'css', 'json',
    'markdown', 'bash', 'powershell'
  ]

  const keyword = (task?.module || '').toLowerCase()
  const activeModuleOptions = modules
    .filter(mod => mod.name.toLowerCase().includes(keyword))
    .map(mod => ({ value: mod.name, label: mod.name }))
  const recycledModuleOptions = (recycleModules || [])
    .filter(mod => mod.name.toLowerCase().includes(keyword))
    .map(mod => ({
      value: mod.name,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{mod.name}</span>
          <Tag color="#eec50cff">在回收站</Tag>
        </div>
      )
    }))
  const moduleOptions = [...activeModuleOptions, ...recycledModuleOptions]

  // 生成树形数据
  const treeData = useMemo(() => {
    return buildTreeData(task?.checkItems?.items || [])
  }, [task?.checkItems?.items])

  // 处理添加/更新勾选项
  const handleAddOrUpdateCheckItem = () => {
    const name = (task?.checkItems?.newItemName || '').trim()
    if (!name) return

    const items = task?.checkItems?.items || []

    // 检查重名 (排除自身，且仅在同级检查)
    const targetParentId = task?.checkItems?.newItemParentId || null
    const isDuplicate = items.some(item => 
      item.name === name && 
      item.id !== editingItemId && 
      (item.parentId || null) === targetParentId
    )
    if (isDuplicate) {
      setCheckItemError('勾选项名称不能重复')
      return
    }

    setCheckItemError('')

    let newItems = [...items]

    if (editingItemId) {
      // 更新现有项
      newItems = newItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name,
            parentId: task?.checkItems?.newItemParentId || null
          }
        }
        return item
      })
      setEditingItemId(null)
    } else {
      // 添加新项
      newItems.push({
        id: Date.now().toString(),
        name,
        checked: false,
        parentId: task?.checkItems?.newItemParentId || null
      })
    }

    onTaskChange({
      ...task,
      checkItems: {
        ...(task?.checkItems || {}),
        items: newItems,
        newItemName: '',
        newItemParentId: null // 重置父级选择
      }
    })
  }

  // 处理删除勾选项
  const handleDeleteCheckItem = (itemId) => {
    const items = task?.checkItems?.items || []
    // 递归查找所有子节点的ID
    const getChildrenIds = (parentId, allItems) => {
      let ids = []
      allItems.forEach(item => {
        if (item.parentId === parentId) {
          ids.push(item.id)
          ids = [...ids, ...getChildrenIds(item.id, allItems)]
        }
      })
      return ids
    }

    const idsToDelete = [itemId, ...getChildrenIds(itemId, items)]
    const newItems = items.filter(item => !idsToDelete.includes(item.id))

    onTaskChange({
      ...task,
      checkItems: {
        ...(task?.checkItems || {}),
        items: newItems
      }
    })

    // 如果正在编辑的项被删除了，退出编辑模式
    if (editingItemId && idsToDelete.includes(editingItemId)) {
      setEditingItemId(null)
      onTaskChange({
        ...task,
        checkItems: {
          ...(task?.checkItems || {}),
          items: newItems,
          newItemName: '',
          newItemParentId: null
        }
      })
    }
  }

  // 处理点击编辑
  const handleEditClick = (item) => {
    setEditingItemId(item.id)
    setEditingRemarkItemId(null)
    onTaskChange({
      ...task,
      checkItems: {
        ...(task?.checkItems || {}),
        newItemName: item.name,
        newItemParentId: item.parentId || null
      }
    })
  }

  // 处理拖拽排序
  const handleDrop = (info) => {
    const dropKey = info.node.key
    const dragKey = info.dragNode.key
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const items = task?.checkItems?.items || []
    const dragItem = items.find(i => i.id === dragKey)
    if (!dragItem) return

    // 移除拖拽项
    let newItems = items.filter(i => i.id !== dragKey)

    // 确定新的父级和位置
    let newParentId = null
    let insertIndex = 0

    if (info.dropToGap) {
      // 放到节点之间
      newParentId = info.node.parentId || null
      const siblings = newItems.filter(i => (i.parentId || null) === newParentId)
      const dropIndex = siblings.findIndex(i => i.id === dropKey)

      if (dropPosition === -1) {
        // 放到目标节点前面
        insertIndex = newItems.findIndex(i => i.id === dropKey)
      } else {
        // 放到目标节点后面
        insertIndex = newItems.findIndex(i => i.id === dropKey) + 1
      }
    } else {
      // 放到节点内部（作为子节点）
      newParentId = dropKey
      // 插入到该父节点的子节点末尾
      const lastChildIndex = newItems.reduce((lastIdx, item, idx) => {
        if ((item.parentId || null) === newParentId) return idx
        return lastIdx
      }, -1)
      insertIndex = lastChildIndex + 1
    }

    // 更新拖拽项的父级
    const updatedDragItem = { ...dragItem, parentId: newParentId }

    // 插入到新位置
    newItems.splice(insertIndex, 0, updatedDragItem)

    onTaskChange({
      ...task,
      checkItems: {
        ...(task?.checkItems || {}),
        items: newItems
      }
    })
  }

  // 处理点击备注编辑
  const handleRemarkClick = (item) => {
    setEditingRemarkItemId(item.id)
    setRemarkInputValue(item.remark || '')
    setEditingItemId(null)
  }

  // 保存备注
  const handleSaveRemark = () => {
    if (!editingRemarkItemId) return

    const items = task?.checkItems?.items || []
    const newItems = items.map(item => {
      if (item.id === editingRemarkItemId) {
        return { ...item, remark: remarkInputValue.trim() }
      }
      return item
    })

    onTaskChange({
      ...task,
      checkItems: {
        ...(task?.checkItems || {}),
        items: newItems
      }
    })
    setEditingRemarkItemId(null)
    setRemarkInputValue('')
  }

  // 取消备注编辑
  const handleCancelRemark = () => {
    setEditingRemarkItemId(null)
    setRemarkInputValue('')
  }

  return (
    <Modal
      open={show}
      title={isEdit ? '编辑任务' : '添加新任务'}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={isEdit ? '确认更新' : '确认添加'}
      cancelText="取消"
      width={800}
      centered
    >
      <div onPaste={onPaste}>
        <Form layout="vertical">
          {/* 任务描述 */}
          <Form.Item label="任务描述" required>
            <Input
              ref={refs?.nameRef}
              placeholder="请输入任务描述"
              value={task?.name || ''}
              onChange={(e) => onTaskChange({ ...task, name: e.target.value })}
              onPressEnter={(e) => {
                e.preventDefault()
                refs?.moduleRef?.current?.focus()
              }}
            />
          </Form.Item>

          {/* 模块、类型、发起人 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="任务所属模块" required>
                <AutoComplete
                  ref={refs?.moduleRef}
                  placeholder="请输入或选择模块名称"
                  value={task?.module || ''}
                  onChange={(value) => onTaskChange({ ...task, module: value })}
                  options={moduleOptions}
                  onFocus={() => onModuleDropdownToggle(true)}
                  onBlur={() => setTimeout(() => onModuleDropdownToggle(false), 200)}
                  onSelect={(value) => onModuleSelect(value)}
                  filterOption={false}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="任务类型" required>
                <AutoComplete
                  placeholder="请选择任务类型"
                  value={task?.type || ''}
                  onChange={(value) => onTaskChange({ ...task, type: value })}
                  options={taskTypes.map(type => ({
                    value: type.name,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag color={type.color}>{type.name}</Tag>
                      </div>
                    )
                  }))}
                  onFocus={() => onTypeDropdownToggle(true)}
                  onBlur={() => setTimeout(() => onTypeDropdownToggle(false), 200)}
                  onSelect={(value) => onTypeSelect(value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="发起人">
                <Input
                  ref={refs?.initiatorRef}
                  placeholder="请输入发起人姓名"
                  value={task?.initiator || ''}
                  onChange={(e) => onTaskChange({ ...task, initiator: e.target.value })}
                  onPressEnter={(e) => {
                    e.preventDefault()
                    refs?.remarkRef?.current?.focus()
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* 备注 */}
          <Form.Item label="备注">
            <TextArea
              ref={refs?.remarkRef}
              placeholder="请输入备注信息"
              value={task?.remark || ''}
              onChange={(e) => onTaskChange({ ...task, remark: e.target.value })}
              rows={2}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>

          {/* 附件图片 */}
          <Form.Item label="附件图片">
            {/* 已有图片预览 (仅编辑模式) */}
            {isEdit && task?.existingImages && task.existingImages.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>已有图片:</div>
                <Space wrap>
                  {task.existingImages.map((imgPath, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 100,
                        height: 100,
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}
                    >
                      <TaskImage
                        src={imgPath}
                        alt={`已有附件${idx + 1}`}
                        onClick={() => {
                          if (onPreviewImage) {
                            // 已有图片直接传递路径
                            onPreviewImage(imgPath, task.existingImages, idx, (deleteIndex) => {
                              const { task: currentTask, onTaskChange: currentOnTaskChange } = latestProps.current
                              // 先从任务数据中移除图片
                              const newExistingImages = [...currentTask.existingImages]
                              newExistingImages.splice(deleteIndex, 1)
                              currentOnTaskChange({ ...currentTask, existingImages: newExistingImages })

                              // 返回更新后的预览图片列表
                              return newExistingImages
                            })
                          }
                        }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                      />
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onRemoveExistingImage(idx)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          minWidth: 24,
                          height: 24,
                          padding: 0
                        }}
                      />
                    </div>
                  ))}
                </Space>
              </div>
            )}

            {/* 上传区域 */}
            <div
              style={{
                border: dragActive ? '2px dashed #1890ff' : '2px dashed #d9d9d9',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
                background: dragActive ? '#f0f5ff' : '#fafafa',
                transition: 'all 0.3s'
              }}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
            >
              <p style={{ marginBottom: 12, color: '#8c8c8c' }}>拖拽图片到此处或粘贴图片 (Ctrl+V)</p>
              <input
                type="file"
                id={isEdit ? "file-input-edit" : "file-input"}
                multiple
                accept="image/*"
                onChange={onImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor={isEdit ? "file-input-edit" : "file-input"}>
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </label>
            </div>

            {/* 新上传图片预览 */}
            {task?.images && task.images.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                  {isEdit ? '新添加的图片:' : '待上传的图片:'}
                </div>
                <Space wrap>
                  {task.images.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 100,
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        padding: 4
                      }}
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        onClick={() => {
                          if (onPreviewImage) {
                            // 为所有新图片生成 blob URL 用于预览
                            const urls = task.images.map(f => URL.createObjectURL(f))
                            // 传递删除回调
                            onPreviewImage(urls[idx], urls, idx, (deleteIndex) => {
                              const { task: currentTask, onTaskChange: currentOnTaskChange } = latestProps.current
                              // 先从任务数据中移除图片
                              const newImages = [...currentTask.images]
                              newImages.splice(deleteIndex, 1)
                              currentOnTaskChange({ ...currentTask, images: newImages })

                              // 返回更新后的预览图片列表，用于 ImagePreview 更新显示
                              return newImages.map(f => URL.createObjectURL(f))
                            })
                          }
                        }}
                        style={{
                          width: '100%',
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                      />
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => onRemoveImage(idx)}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          minWidth: 24,
                          height: 24,
                          padding: 0
                        }}
                      />
                      <div style={{
                        fontSize: 11,
                        color: '#8c8c8c',
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </div>
                    </div>
                  ))}
                </Space>
              </div>
            )}
          </Form.Item>

          {/* 勾选项配置 */}
          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Switch
                  checked={task?.checkItems?.enabled || false}
                  onChange={(checked) => onTaskChange({
                    ...task,
                    checkItems: {
                      ...(task?.checkItems || {}),
                      enabled: checked,
                      mode: task?.checkItems?.mode || 'multiple',
                      items: task?.checkItems?.items || []
                    }
                  })}
                />
                <span>{task?.checkItems?.enabled ? '关闭勾选项' : '添加勾选项'}</span>
              </div>

              {task?.checkItems?.enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#666' }}>勾选方式:</span>
                    <Radio.Group
                      value={task?.checkItems?.mode || 'multiple'}
                      onChange={(e) => {
                        const mode = e.target.value
                        // 切换到单选时，只保留第一个已勾选的项
                        let items = task?.checkItems?.items || []
                        if (mode === 'single') {
                          const firstChecked = items.findIndex(item => item.checked)
                          items = items.map((item, idx) => ({
                            ...item,
                            checked: idx === firstChecked
                          }))
                        }
                        onTaskChange({
                          ...task,
                          checkItems: {
                            ...(task?.checkItems || {}),
                            mode,
                            items
                          }
                        })
                      }}
                      optionType="button"
                      buttonStyle="solid"
                      size="small"
                    >
                      <Radio.Button value="multiple">多选</Radio.Button>
                      <Radio.Button value="single">单选</Radio.Button>
                    </Radio.Group>
                  </div>
                  {task?.checkItems?.mode !== 'single' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#666' }}>父子联动:</span>
                      <Switch
                        size="small"
                        checked={task?.checkItems?.linkage !== false} // 默认为 true
                        onChange={(checked) => onTaskChange({
                          ...task,
                          checkItems: {
                            ...(task?.checkItems || {}),
                            linkage: checked
                          }
                        })}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {task?.checkItems?.enabled && (
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
                {/* 勾选项树形列表 */}
                {task?.checkItems?.items && task.checkItems.items.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                      已添加的勾选项 ({task.checkItems.items.length}):
                    </div>
                    <Tree
                      treeData={treeData}
                      defaultExpandAll
                      draggable
                      onDrop={handleDrop}
                      titleRender={(nodeData) => (
                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', paddingRight: 8 }}>
                          <div className="group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{nodeData.title}</span>
                              {nodeData.remark && (
                                <Tooltip title={nodeData.remark}>
                                  <FileTextOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                                </Tooltip>
                              )}
                            </div>
                            <Space size={2}>
                              {/* 备注按钮 */}
                              <Tooltip title="备注">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<FileTextOutlined />}
                                  style={{ color: nodeData.remark ? '#1890ff' : undefined }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemarkClick(nodeData)
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="添加子项">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // 设置父级ID，重置编辑状态
                                    setEditingItemId(null)
                                    setEditingRemarkItemId(null)
                                    setCheckItemError('')
                                    onTaskChange({
                                      ...task,
                                      checkItems: {
                                        ...(task?.checkItems || {}),
                                        newItemName: '',
                                        newItemParentId: nodeData.id
                                      }
                                    })
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="编辑">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditClick(nodeData)
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="删除">
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCheckItem(nodeData.id)
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="拖动排序">
                                <HolderOutlined style={{ cursor: 'grab', color: '#999', padding: '4px' }} />
                              </Tooltip>
                            </Space>
                          </div>
                          {/* 备注编辑区域 */}
                          {editingRemarkItemId === nodeData.id && (
                            <div style={{ marginTop: 8, marginBottom: 4 }} onClick={(e) => e.stopPropagation()}>
                              <TextArea
                                placeholder="输入备注内容"
                                value={remarkInputValue}
                                onChange={(e) => setRemarkInputValue(e.target.value)}
                                autoSize={{ minRows: 2, maxRows: 6 }}
                                autoFocus
                                style={{ marginBottom: 8 }}
                              />
                              <Space>
                                <Button type="primary" size="small" onClick={handleSaveRemark}>保存</Button>
                                <Button size="small" onClick={handleCancelRemark}>取消</Button>
                              </Space>
                            </div>
                          )}
                        </div>
                      )}
                      blockNode
                    />
                  </div>
                )}

                {/* 输入区域 */}
                <div style={{ marginTop: 12 }}>
                  {/* 父级提示 */}
                  {!editingItemId && task?.checkItems?.newItemParentId && (
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ color: '#8c8c8c', marginRight: 8 }}>添加到:</span>
                      <Tag
                        closable
                        onClose={() => {
                          onTaskChange({
                            ...task,
                            checkItems: {
                              ...(task?.checkItems || {}),
                              newItemParentId: null
                            }
                          })
                        }}
                        color="blue"
                      >
                        {task.checkItems.items.find(i => i.id === task.checkItems.newItemParentId)?.name || '未知项'}
                      </Tag>
                    </div>
                  )}
                  {/* 编辑提示 */}
                  {editingItemId && (
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ color: '#faad14', marginRight: 8 }}>正在编辑:</span>
                      <Tag
                        closable
                        onClose={() => {
                          setEditingItemId(null)
                          onTaskChange({
                            ...task,
                            checkItems: {
                              ...(task?.checkItems || {}),
                              newItemName: '',
                              newItemParentId: null
                            }
                          })
                        }}
                        color="orange"
                      >
                        {task.checkItems.items.find(i => i.id === editingItemId)?.name || '未知项'}
                      </Tag>
                    </div>
                  )}

                  <Form.Item
                    style={{ marginBottom: 0 }}
                    validateStatus={checkItemError ? 'error' : undefined}
                    help={checkItemError || undefined}
                  >
                    <Space.Compact style={{ width: '100%' }}>
                      <Input
                        placeholder={editingItemId ? "修改勾选项名称" : (task?.checkItems?.newItemParentId ? "输入子项名称" : "添加勾选项")}
                        value={task?.checkItems?.newItemName || ''}
                        status={checkItemError ? 'error' : undefined}
                        onChange={(e) => {
                          setCheckItemError('')
                          onTaskChange({
                            ...task,
                            checkItems: {
                              ...(task?.checkItems || {}),
                              newItemName: e.target.value
                            }
                          })
                        }}
                        onPressEnter={(e) => {
                          e.preventDefault()
                          handleAddOrUpdateCheckItem()
                        }}
                      />
                      <Button
                        type="primary"
                        onClick={handleAddOrUpdateCheckItem}
                        icon={editingItemId ? <EditOutlined /> : <PlusOutlined />}
                      >
                        {editingItemId ? '保存' : '添加'}
                      </Button>
                    </Space.Compact>
                  </Form.Item>
                </div>
              </div>
            )}
          </Form.Item>

          {/* 代码块选项 */}
          <Form.Item>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Switch
                checked={task?.codeBlock?.enabled || false}
                onChange={(checked) => onTaskChange({
                  ...task,
                  codeBlock: {
                    ...(task?.codeBlock || {}),
                    enabled: checked
                  }
                })}
              />
              <CodeOutlined />
              <span>{task?.codeBlock?.enabled ? '关闭代码块' : '添加代码块'}</span>
            </div>

            {task?.codeBlock?.enabled && (
              <div>
                <Row gutter={16} style={{ marginBottom: 12 }}>
                  <Col span={24}>
                    <Form.Item label="" style={{ marginBottom: 0 }}>
                      <AutoComplete
                        placeholder="如: javascript, python..."
                        value={task?.codeBlock?.language ?? 'javascript'}
                        onChange={(value) => onTaskChange({
                          ...task,
                          codeBlock: {
                            ...(task?.codeBlock || {}),
                            language: value
                          }
                        })}
                        options={languages.map(lang => ({ value: lang }))}
                        style={{ width: 200 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <div style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  overflow: 'hidden',
                  backgroundColor: '#2d2d2d',
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                }}>
                  <Editor
                    value={task?.codeBlock?.code || ''}
                    onValueChange={(code) => onTaskChange({
                      ...task,
                      codeBlock: {
                        ...(task?.codeBlock || {}),
                        code
                      }
                    })}
                    highlight={code => {
                      const lang = task?.codeBlock?.language || 'javascript'
                      const prismLang = lang === 'html' ? 'markup' : lang
                      const grammar = Prism.languages[prismLang] || Prism.languages.javascript
                      return Prism.highlight(code, grammar, prismLang)
                    }}
                    padding={10}
                    style={{
                      fontFamily: '"Fira code", "Fira Mono", monospace',
                      fontSize: 14,
                      minHeight: '150px',
                      color: '#ccc',
                    }}
                    textareaClassName={styles.codeEditorTextarea}
                  />
                </div>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
