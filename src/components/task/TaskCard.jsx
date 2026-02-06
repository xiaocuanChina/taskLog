/**
 * 任务卡片组件 - 全新设计
 *
 * 设计理念：
 * - 扁平化设计，去除多余装饰
 * - 信息层次清晰，一目了然
 * - 交互简洁直观
 * - 响应式布局
 */
import { useState, useEffect, useRef } from 'react'
import { Button, Checkbox, Radio, Progress, Tooltip, Dropdown } from 'antd'
import {
  CheckOutlined,
  RollbackOutlined,
  DeleteOutlined,
  EditOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  FolderOutlined,
  CopyOutlined,
  PauseCircleOutlined
} from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import TaskImage from '../common/TaskImage'
import { useToast } from '../../context/ToastContext'

export default function TaskCard({
  task,
  isCompleted,
  isShelved = false,
  taskTypeColors = {},
  onComplete,
  onRollback,
  onEdit,
  onDelete,
  onImageClick,
  onEditModule,
  onShelve,
  onUnshelve,
  onCheckItemChange
}) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isCodeCopied, setIsCodeCopied] = useState(false)
  const [selectedImages, setSelectedImages] = useState(new Set())
  const [initialSelectedImages, setInitialSelectedImages] = useState(new Set())
  const [isDraggingSelection, setIsDraggingSelection] = useState(false)
  const isDraggingRef = useRef(false)
  const [dragStartIndex, setDragStartIndex] = useState(null)
  const clickTimeoutRef = useRef(null)
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null)
  const showToast = useToast()

  useEffect(() => {
    isDraggingRef.current = isDraggingSelection
  }, [isDraggingSelection])

  // 图片选择相关逻辑
  const toggleImageSelection = (e, index) => {
    e?.stopPropagation?.()
    const newSelected = new Set(selectedImages)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedImages(newSelected)
  }

  const handleMouseDown = (index) => {
    setDragStartIndex(index)
    setInitialSelectedImages(new Set(selectedImages))
  }

  const handleMouseEnter = (index) => {
    if (dragStartIndex !== null) {
      if (!isDraggingSelection) {
        setIsDraggingSelection(true)
      }
      const start = Math.min(dragStartIndex, index)
      const end = Math.max(dragStartIndex, index)
      const newSelected = new Set(initialSelectedImages)
      for (let i = start; i <= end; i++) {
        if (initialSelectedImages.has(i)) {
          newSelected.delete(i)
        } else {
          newSelected.add(i)
        }
      }
      setSelectedImages(newSelected)
    }
  }

  const handleMouseUp = () => {
    if (isDraggingSelection) {
      setTimeout(() => {
        setIsDraggingSelection(false)
        setInitialSelectedImages(new Set())
      }, 0)
    } else {
      setInitialSelectedImages(new Set())
    }
    setDragStartIndex(null)
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingSelection || dragStartIndex !== null) {
        setTimeout(() => {
          setIsDraggingSelection(false)
          setDragStartIndex(null)
          setInitialSelectedImages(new Set())
        }, 0)
      }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDraggingSelection, dragStartIndex])

  const handleImageClick = (e, img, images, idx) => {
    e.stopPropagation()
    if (isDraggingRef.current) return
    if (selectedImages.size > 0) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }
      clickTimeoutRef.current = setTimeout(() => {
        toggleImageSelection(null, idx)
        clickTimeoutRef.current = null
      }, 250)
    } else {
      onImageClick(img, images, idx)
    }
  }

  // 任务操作
  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await onComplete(task.id)
    } catch (error) {
      showToast('操作失败，请重试', 'error')
    } finally {
      setTimeout(() => setIsCompleting(false), 300)
    }
  }

  const handleRollback = async () => {
    setIsRollingBack(true)
    try {
      await onRollback(task.id)
    } catch (error) {
      showToast('操作失败，请重试', 'error')
    } finally {
      setTimeout(() => setIsRollingBack(false), 300)
    }
  }

  const handleShelve = async () => {
    try {
      await onShelve(task.id)
    } catch (error) {
      showToast('搁置失败，请重试', 'error')
    }
  }

  const handleUnshelve = async () => {
    try {
      await onUnshelve(task.id)
    } catch (error) {
      showToast('取消搁置失败，请重试', 'error')
    }
  }

  const handleCopyCode = async () => {
    if (!task.codeBlock?.code) return
    try {
      await navigator.clipboard.writeText(task.codeBlock.code)
      setIsCodeCopied(true)
      showToast('代码已复制')
      setTimeout(() => setIsCodeCopied(false), 2000)
    } catch (error) {
      showToast('复制失败', 'error')
    }
  }

  const handleCopyImage = async (img, idx) => {
    try {
      let imagesToCopy = []
      if (selectedImages.has(idx) && selectedImages.size > 0) {
        imagesToCopy = task.images.filter((_, i) => selectedImages.has(i))
      } else {
        imagesToCopy = [img]
      }
      if (imagesToCopy.length === 0) return

      if (imagesToCopy.length > 1 && window.electron?.clipboard?.writeFiles) {
        const filePaths = []
        let allPathsFound = true
        for (const imageSrc of imagesToCopy) {
          if (!imageSrc.startsWith('blob:') && !imageSrc.startsWith('http')) {
            let pathToCheck = imageSrc
            if (pathToCheck.startsWith('file://')) {
              pathToCheck = pathToCheck.replace('file://', '')
            }
            const absPath = await window.electron.image.getPath(pathToCheck)
            if (absPath) {
              filePaths.push(absPath)
            } else {
              allPathsFound = false
            }
          } else {
            allPathsFound = false
          }
        }
        if (allPathsFound && filePaths.length === imagesToCopy.length) {
          const success = await window.electron.clipboard.writeFiles(filePaths)
          if (success) {
            showToast(`已复制 ${filePaths.length} 张图片文件`)
            setSelectedImages(new Set())
            return
          }
        }
      }

      const clipboardItems = []
      for (const imageSrc of imagesToCopy) {
        let src = imageSrc
        if (!src.startsWith('blob:') && !src.startsWith('http')) {
          if (src.startsWith('file://')) {
            const cleanPath = src.replace('file://', '')
            const absPath = await window.electron?.image?.getPath(cleanPath)
            if (absPath) {
              src = `file:///${absPath.replace(/\\/g, '/')}`
            }
          } else {
            const absPath = await window.electron?.image?.getPath(src)
            if (absPath) {
              src = `file:///${absPath.replace(/\\/g, '/')}`
            }
          }
        }
        const response = await fetch(src)
        const blob = await response.blob()
        clipboardItems.push(new ClipboardItem({ [blob.type]: blob }))
      }

      if (clipboardItems.length > 0) {
        try {
          await navigator.clipboard.write(clipboardItems)
          showToast(clipboardItems.length > 1 ? `已复制 ${clipboardItems.length} 张图片` : '图片已复制')
        } catch (err) {
          if (clipboardItems.length > 1) {
            await navigator.clipboard.write([clipboardItems[0]])
            showToast('已复制第一张图片 (多图复制受限)', 'warning')
          } else {
            throw err
          }
        }
      }
      setSelectedImages(new Set())
    } catch (error) {
      showToast('复制图片失败', 'error')
    }
  }

  const handleCheckItemChange = (itemId, checked) => {
    if (!onCheckItemChange) return
    const checkItems = task.checkItems
    let newItems = [...checkItems.items]

    if (checkItems.mode === 'single') {
      newItems = newItems.map(item => ({
        ...item,
        checked: item.id === itemId ? checked : false
      }))
    } else {
      const isLinkageEnabled = task.checkItems.linkage !== false
      if (isLinkageEnabled) {
        const updateChildren = (parentId, isChecked, items) => {
          items.forEach(item => {
            if (item.parentId === parentId) {
              item.checked = isChecked
              updateChildren(item.id, isChecked, items)
            }
          })
        }
        const currentItemIndex = newItems.findIndex(item => item.id === itemId)
        if (currentItemIndex > -1) {
          newItems[currentItemIndex] = { ...newItems[currentItemIndex], checked }
          updateChildren(itemId, checked, newItems)
        }
        const checkParentStatus = (parentId, items) => {
          const children = items.filter(item => item.parentId === parentId)
          if (children.length === 0) return false
          return children.every(item => item.checked)
        }
        const updateParents = (currentId, items) => {
          const currentItem = items.find(item => item.id === currentId)
          if (!currentItem || !currentItem.parentId) return
          const parentId = currentItem.parentId
          const parentIndex = items.findIndex(item => item.id === parentId)
          if (parentIndex > -1) {
            const allSiblingsChecked = checkParentStatus(parentId, items)
            if (items[parentIndex].checked !== allSiblingsChecked) {
              items[parentIndex] = { ...items[parentIndex], checked: allSiblingsChecked }
              updateParents(parentId, items)
            }
          }
        }
        updateParents(itemId, newItems)
      } else {
        const currentItemIndex = newItems.findIndex(item => item.id === itemId)
        if (currentItemIndex > -1) {
          newItems[currentItemIndex] = { ...newItems[currentItemIndex], checked }
        }
      }
    }
    onCheckItemChange(task.id, newItems)
  }

  const getCheckProgress = () => {
    if (!task.checkItems?.enabled || !task.checkItems?.items?.length) return null
    const total = task.checkItems.items.length
    const checked = task.checkItems.items.filter(item => item.checked).length
    return { total, checked, percent: Math.round((checked / total) * 100) }
  }

  const checkProgress = getCheckProgress()

  // 渲染勾选项树
  const renderCheckItems = (parentId = null, level = 0) => {
    const currentLevelItems = task.checkItems.items.filter(item =>
      (item.parentId || null) === parentId
    )
    if (currentLevelItems.length === 0) return null

    return currentLevelItems.map(item => (
      <div key={item.id} style={{ marginLeft: level * 20, marginBottom: 6 }}>
        {task.checkItems.mode === 'single' ? (
          <div>
            <Radio
              value={item.id}
              style={{ fontSize: 13 }}
              disabled={isCompleted}
              checked={item.checked}
              onChange={(e) => {
                if (e.target.checked) {
                  handleCheckItemChange(item.id, true)
                }
              }}
            >
              {item.name}
            </Radio>
            {item.remark && (
              <div style={{ marginLeft: 24, marginTop: 2, fontSize: 11, color: '#94a3b8' }}>
                {item.remark}
              </div>
            )}
          </div>
        ) : (
          <div>
            <Checkbox
              checked={item.checked}
              onChange={(e) => handleCheckItemChange(item.id, e.target.checked)}
              disabled={isCompleted}
              style={{ fontSize: 13 }}
            >
              <span style={{
                textDecoration: item.checked ? 'line-through' : 'none',
                color: item.checked ? '#94a3b8' : 'inherit'
              }}>
                {item.name}
              </span>
            </Checkbox>
            {item.remark && (
              <div style={{ marginLeft: 24, marginTop: 2, fontSize: 11, color: '#94a3b8' }}>
                {item.remark}
              </div>
            )}
          </div>
        )}
        {renderCheckItems(item.id, level + 1)}
      </div>
    ))
  }

  return (
    <div
      style={{
        marginBottom: 10,
        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
        borderRadius: 12,
        border: isCompleted 
          ? '2px solid #10b981' 
          : isShelved 
            ? '2px solid #f59e0b'
            : '2px solid transparent',
        overflow: 'hidden',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.08)'
        if (!isCompleted && !isShelved) {
          e.currentTarget.style.borderColor = '#e0e7ff'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
        if (!isCompleted && !isShelved) {
          e.currentTarget.style.borderColor = 'transparent'
        }
      }}
    >
      {/* 左侧状态指示条 */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: isCompleted
          ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)'
          : isShelved
            ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
            : 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)',
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10
      }} />

      {/* 卡片主体 */}
      <div style={{ padding: '16px 18px 16px 22px' }}>
        {/* 头部行 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* 完成状态复选框 */}
          <div style={{ flexShrink: 0, paddingTop: 3 }}>
            {isCompleted ? (
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}>
                <CheckOutlined style={{ fontSize: 14, color: '#ffffff', fontWeight: 'bold' }} />
              </div>
            ) : (
              <div
                onClick={handleComplete}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: '2px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#ffffff'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {isCompleting && <LoadingOutlined style={{ fontSize: 12, color: '#10b981' }} />}
              </div>
            )}
          </div>

          {/* 任务信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 15,
              fontWeight: 600,
              color: isCompleted ? '#94a3b8' : '#1e293b',
              textDecoration: isCompleted ? 'line-through' : 'none',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              marginBottom: 8,
              letterSpacing: '-0.01em'
            }}>
              {task.name}
            </div>

            {/* 元信息 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {task.type && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px 8px',
                  background: taskTypeColors[task.type] || '#3b82f6',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: `0 2px 6px ${taskTypeColors[task.type] || '#3b82f6'}40`
                }}>
                  {task.type}
                </div>
              )}
              {!isCompleted && task.module && (
                <div
                  onClick={() => onEditModule && onEditModule(task)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    cursor: 'pointer',
                    border: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    color: '#64748b',
                    fontSize: 11,
                    fontWeight: 600,
                    borderRadius: 6,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                    e.currentTarget.style.color = '#475569'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0'
                    e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                    e.currentTarget.style.color = '#64748b'
                  }}
                >
                  <FolderOutlined style={{ fontSize: 10 }} />
                  {task.module}
                </div>
              )}
              <span style={{ 
                fontSize: 11, 
                color: '#94a3b8', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 4,
                fontWeight: 500
              }}>
                <ClockCircleOutlined style={{ fontSize: 11 }} />
                {new Date(task.createdAt).toLocaleString('zh-CN', {
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2 }}>
            {isCompleted ? (
              <Tooltip title="回滚到待办">
                <Button
                  type="text"
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={handleRollback}
                  loading={isRollingBack}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    color: '#f59e0b',
                    borderRadius: 8,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                    e.currentTarget.style.color = '#d97706'
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#f59e0b'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                />
              </Tooltip>
            ) : isShelved ? (
              <>
                <Tooltip title="取消搁置">
                  <Button
                    type="text"
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={handleUnshelve}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      color: '#10b981',
                      borderRadius: 8,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
                      e.currentTarget.style.color = '#059669'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#10b981'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(task)}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      color: '#ef4444',
                      borderRadius: 8,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                      e.currentTarget.style.color = '#dc2626'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#ef4444'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  />
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(task)}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      color: '#3b82f6',
                      borderRadius: 8,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                      e.currentTarget.style.color = '#2563eb'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#3b82f6'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  />
                </Tooltip>
                <Tooltip title="搁置">
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={handleShelve}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      color: '#f59e0b',
                      borderRadius: 8,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                      e.currentTarget.style.color = '#d97706'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#f59e0b'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(task)}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      color: '#ef4444',
                      borderRadius: 8,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
                      e.currentTarget.style.color = '#dc2626'
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#ef4444'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  />
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* 备注 */}
        {task.remark && (
          <div style={{
            padding: 12,
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: 8,
            fontSize: 13,
            marginTop: 14,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: '#475569',
            lineHeight: 1.6,
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)'
          }}>
            {task.remark}
          </div>
        )}

        {/* 勾选项 */}
        {task.checkItems?.enabled && task.checkItems?.items?.length > 0 && (
          <div style={{
            marginTop: 14,
            padding: 12,
            background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
            borderRadius: 8,
            border: '1px solid #fde68a',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#78350f', letterSpacing: '0.3px' }}>
                {task.checkItems.mode === 'single' ? '📋 单选项' : '✅ 检查清单'}
              </span>
              {checkProgress && task.checkItems.mode !== 'single' && (
                <span style={{ 
                  fontSize: 11, 
                  color: '#92400e',
                  fontWeight: 600,
                  padding: '2px 8px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 4
                }}>
                  {checkProgress.checked}/{checkProgress.total}
                </span>
              )}
            </div>
            {checkProgress && task.checkItems.mode !== 'single' && (
              <Progress
                percent={checkProgress.percent}
                size="small"
                strokeColor={checkProgress.percent === 100 ? '#10b981' : '#3b82f6'}
                showInfo={false}
                style={{ marginBottom: 10 }}
              />
            )}
            {task.checkItems.mode === 'single' ? (
              <Radio.Group 
                value={task.checkItems.items.find(item => item.checked)?.id}
                disabled={isCompleted}
                style={{ width: '100%' }}
              >
                <div>{renderCheckItems()}</div>
              </Radio.Group>
            ) : (
              <div>{renderCheckItems()}</div>
            )}
          </div>
        )}

        {/* 图片 */}
        {task.images && task.images.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: 8,
              marginTop: 14
            }}
            onMouseLeave={handleMouseUp}
          >
            {task.images.map((img, idx) => (
              <Dropdown
                key={idx}
                menu={{
                  items: [{ key: 'copy', label: '复制', icon: <CopyOutlined />, onClick: () => handleCopyImage(img, idx) }]
                }}
                trigger={['contextMenu']}
              >
                <div
                  onClick={(e) => handleImageClick(e, img, task.images, idx)}
                  onMouseDown={(e) => {
                    if (e.button === 0) {
                      e.preventDefault()
                      handleMouseDown(idx)
                    }
                  }}
                  onMouseEnter={(e) => {
                    handleMouseEnter(idx)
                    setHoveredImageIndex(idx)
                    if (!selectedImages.has(idx)) {
                      e.currentTarget.style.borderColor = '#cbd5e1'
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    setHoveredImageIndex(null)
                    if (!selectedImages.has(idx)) {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.transform = 'scale(1)'
                    }
                  }}
                  onMouseUp={handleMouseUp}
                  style={{
                    width: '100%',
                    paddingBottom: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 8,
                    border: selectedImages.has(idx) ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: selectedImages.has(idx) ? '0 4px 12px rgba(59, 130, 246, 0.25)' : '0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  {(selectedImages.has(idx) || (selectedImages.size > 0 && hoveredImageIndex === idx)) && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{ position: 'absolute', top: 6, left: 6, zIndex: 10 }}
                    >
                      <Checkbox
                        checked={selectedImages.has(idx)}
                        onClick={(e) => toggleImageSelection(e, idx)}
                        style={{ 
                          background: 'rgba(255,255,255,0.95)', 
                          borderRadius: 4, 
                          padding: 3,
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
                        }}
                      />
                    </div>
                  )}
                  <TaskImage
                    src={img}
                    alt={`附件${idx + 1}`}
                    draggable={false}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              </Dropdown>
            ))}
          </div>
        )}

        {/* 代码块 */}
        {task.codeBlock?.enabled && task.codeBlock?.code && (
          <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#cbd5e1',
              padding: '8px 12px',
              fontSize: 11,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <span>💻 {task.codeBlock.language || 'text'}</span>
              <Button
                type="text"
                size="small"
                icon={isCodeCopied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={handleCopyCode}
                style={{ 
                  color: isCodeCopied ? '#10b981' : '#cbd5e1', 
                  height: 22, 
                  padding: '0 6px',
                  borderRadius: 4,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isCodeCopied) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.color = '#ffffff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCodeCopied) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#cbd5e1'
                  }
                }}
              />
            </div>
            <div>
              <SyntaxHighlighter
                language={task.codeBlock.language || 'text'}
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '12px', padding: '12px' }}
              >
                {task.codeBlock.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
