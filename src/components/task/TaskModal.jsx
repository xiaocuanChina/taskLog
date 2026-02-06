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
import { useEffect, useRef, useState } from 'react'
import { Modal, Input, Form, Button, Switch, AutoComplete, Tag } from 'antd'
import { UploadOutlined, DeleteOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons'
import TaskImage from '../common/TaskImage'
import CheckItemsManager from './CheckItemsManager'
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
      title={null}
      footer={null}
      onCancel={onCancel}
      width={800}
      centered
      className={styles.taskModal}
      destroyOnHidden
      closable={false}
    >
      <div className={styles.container} onPaste={onPaste}>
        {/* 自定义头部 */}
        <div className={styles.header}>
          <div className={styles.modalTitle}>
            <FileTextOutlined />
            <span>{isEdit ? '编辑任务' : '添加新任务'}</span>
          </div>
          <div className={styles.closeBtn} onClick={onCancel}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        </div>

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

          {/* 模块、类型、发起人 - 三列布局 */}
          <div className={styles.formRow}>
            <Form.Item label="任务所属模块" required>
              <AutoComplete
                value={task?.module || ''}
                onChange={(value) => onTaskChange({ ...task, module: value })}
                options={moduleOptions}
                onSelect={(value) => onModuleSelect(value)}
                filterOption={false}
              >
                <Input
                  ref={refs?.moduleRef}
                  placeholder="请输入或选择模块名称"
                  onFocus={() => onModuleDropdownToggle(true)}
                  onBlur={() => setTimeout(() => onModuleDropdownToggle(false), 200)}
                />
              </AutoComplete>
            </Form.Item>
            <Form.Item label="任务类型" required>
              <AutoComplete
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
                onSelect={(value) => onTypeSelect(value)}
              >
                <Input
                  placeholder="请选择任务类型"
                  onFocus={() => onTypeDropdownToggle(true)}
                  onBlur={() => setTimeout(() => onTypeDropdownToggle(false), 200)}
                />
              </AutoComplete>
            </Form.Item>
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
          </div>

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
              <div className={styles.imageSection}>
                <div className={styles.sectionLabel}>
                  <span>已有图片</span>
                  <Tag color="blue">{task.existingImages.length}</Tag>
                </div>
                <div className={styles.imageGrid}>
                  {task.existingImages.map((imgPath, idx) => (
                    <div key={idx} className={styles.imageItem}>
                      <TaskImage
                        src={imgPath}
                        alt={`已有附件${idx + 1}`}
                        onClick={() => {
                          if (onPreviewImage) {
                            onPreviewImage(imgPath, task.existingImages, idx, (deleteIndex) => {
                              const { task: currentTask, onTaskChange: currentOnTaskChange } = latestProps.current
                              const newExistingImages = [...currentTask.existingImages]
                              newExistingImages.splice(deleteIndex, 1)
                              currentOnTaskChange({ ...currentTask, existingImages: newExistingImages })
                              return newExistingImages
                            })
                          }
                        }}
                        className={styles.imagePreview}
                      />
                      <button
                        className={styles.btnRemoveImage}
                        onClick={() => onRemoveExistingImage(idx)}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 上传区域 */}
            <div
              className={`${styles.uploadArea} ${dragActive ? styles.dragActive : ''}`}
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
            >
              <p className={styles.uploadText}>
                拖拽图片到此处或粘贴图片 (Ctrl+V)
              </p>
              <input
                type="file"
                id={isEdit ? "file-input-edit" : "file-input"}
                multiple
                accept="image/*"
                onChange={onImageChange}
                style={{ display: 'none' }}
              />
              <label htmlFor={isEdit ? "file-input-edit" : "file-input"}>
                <Button icon={<UploadOutlined />} className={styles.uploadButton}>
                  选择文件
                </Button>
              </label>
            </div>

            {/* 新上传图片预览 */}
            {task?.images && task.images.length > 0 && (
              <div className={styles.imageSection}>
                <div className={styles.sectionLabel}>
                  <span>{isEdit ? '新添加的图片' : '待上传的图片'}</span>
                  <Tag color="green">{task.images.length}</Tag>
                </div>
                <div className={styles.imageGrid}>
                  {task.images.map((file, idx) => (
                    <div key={idx} className={styles.uploadImageItem}>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        onClick={() => {
                          if (onPreviewImage) {
                            const urls = task.images.map(f => URL.createObjectURL(f))
                            onPreviewImage(urls[idx], urls, idx, (deleteIndex) => {
                              const { task: currentTask, onTaskChange: currentOnTaskChange } = latestProps.current
                              const newImages = [...currentTask.images]
                              newImages.splice(deleteIndex, 1)
                              currentOnTaskChange({ ...currentTask, images: newImages })
                              return newImages.map(f => URL.createObjectURL(f))
                            })
                          }
                        }}
                        className={styles.uploadImagePreview}
                      />
                      <button
                        className={styles.btnRemoveImage}
                        onClick={() => onRemoveImage(idx)}
                      >
                        <DeleteOutlined />
                      </button>
                      <div className={styles.uploadImageName}>
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Form.Item>

          {/* 勾选项配置 */}
          <Form.Item label="勾选项配置">
            <CheckItemsManager
              checkItems={task?.checkItems}
              onChange={(updatedCheckItems) => {
                onTaskChange({
                  ...task,
                  checkItems: updatedCheckItems
                })
              }}
            />
          </Form.Item>

          {/* 代码块选项 */}
          <Form.Item label="代码块">
            <div className={styles.codeBlockSection}>
              <div className={styles.codeBlockToggle}>
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
                <span>{task?.codeBlock?.enabled ? '关闭代码块' : '启用代码块'}</span>
              </div>

              {task?.codeBlock?.enabled && (
                <div className={styles.codeBlockContent}>
                  <div className={styles.codeBlockHeader}>
                    <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>编程语言:</span>
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
                  </div>
                  <div className={styles.codeEditor}>
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
                      padding={16}
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", "Consolas", "Monaco", monospace',
                        fontSize: 13,
                        minHeight: '200px',
                        color: '#d4d4d4',
                      }}
                      textareaClassName={styles.codeEditorTextarea}
                    />
                  </div>
                </div>
              )}
            </div>
          </Form.Item>
        </Form>

        {/* 自定义底部 */}
        <div className={styles.footer}>
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button type="primary" onClick={onConfirm}>
            {isEdit ? '确认更新' : '确认添加'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
