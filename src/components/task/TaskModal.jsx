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
import React, { useEffect, useRef, useState } from 'react'
import { Modal, Input, Form, Row, Col, Button, Switch, AutoComplete, Space, Tag } from 'antd'
import { UploadOutlined, DeleteOutlined, CodeOutlined } from '@ant-design/icons'
import TaskImage from '../common/TaskImage'
import styles from './TaskModal.module.css'

const { TextArea } = Input
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
  
  // Modal 关闭时清除错误状态
  useEffect(() => {
    if (!show) {
      setCheckItemError('')
    }
  }, [show])

  // 监听 Ctrl+S 快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        if (show) {
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
  }, [show, onConfirm])

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
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
              <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
                <Row gutter={16} style={{ marginBottom: 12 }}>
                  <Col span={8}>
                    <Form.Item label="勾选方式" style={{ marginBottom: 0 }}>
                      <AutoComplete
                        value={task?.checkItems?.mode === 'single' ? '单选' : '多选'}
                        onChange={(value) => {
                          const mode = value === '单选' ? 'single' : 'multiple'
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
                        options={[{ value: '多选' }, { value: '单选' }]}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item 
                      label="添加勾选项" 
                      style={{ marginBottom: 0 }}
                      validateStatus={checkItemError ? 'error' : undefined}
                      help={checkItemError || undefined}
                    >
                      <Space.Compact style={{ width: '100%' }}>
                        <Input
                          placeholder="输入勾选项名称后按回车添加"
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
                            const name = (task?.checkItems?.newItemName || '').trim()
                            if (name) {
                              const items = task?.checkItems?.items || []
                              // 检查是否已存在同名勾选项
                              const isDuplicate = items.some(item => item.name === name)
                              if (isDuplicate) {
                                setCheckItemError('勾选项名称不能重复')
                                return
                              }
                              setCheckItemError('')
                              onTaskChange({
                                ...task,
                                checkItems: {
                                  ...(task?.checkItems || {}),
                                  items: [...items, { id: Date.now().toString(), name, checked: false }],
                                  newItemName: ''
                                }
                              })
                            }
                          }}
                        />
                        <Button
                          type="primary"
                          onClick={() => {
                            const name = (task?.checkItems?.newItemName || '').trim()
                            if (name) {
                              const items = task?.checkItems?.items || []
                              // 检查是否已存在同名勾选项
                              const isDuplicate = items.some(item => item.name === name)
                              if (isDuplicate) {
                                setCheckItemError('勾选项名称不能重复')
                                return
                              }
                              setCheckItemError('')
                              onTaskChange({
                                ...task,
                                checkItems: {
                                  ...(task?.checkItems || {}),
                                  items: [...items, { id: Date.now().toString(), name, checked: false }],
                                  newItemName: ''
                                }
                              })
                            }
                          }}
                        >
                          添加
                        </Button>
                      </Space.Compact>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 勾选项列表 */}
                {task?.checkItems?.items && task.checkItems.items.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 8 }}>
                      已添加的勾选项 ({task.checkItems.items.length}):
                    </div>
                    <Space wrap>
                      {task.checkItems.items.map((item, idx) => (
                        <Tag
                          key={item.id}
                          closable
                          onClose={() => {
                            const items = [...task.checkItems.items]
                            items.splice(idx, 1)
                            onTaskChange({
                              ...task,
                              checkItems: {
                                ...(task?.checkItems || {}),
                                items
                              }
                            })
                          }}
                          style={{ padding: '4px 8px', fontSize: 13 }}
                        >
                          {item.name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}
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
                <TextArea
                  placeholder="请输入代码..."
                  value={task?.codeBlock?.code || ''}
                  onChange={(e) => onTaskChange({
                    ...task,
                    codeBlock: {
                      ...(task?.codeBlock || {}),
                      code: e.target.value
                    }
                  })}
                  rows={6}
                  className={styles.codeEditor}
                />
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
