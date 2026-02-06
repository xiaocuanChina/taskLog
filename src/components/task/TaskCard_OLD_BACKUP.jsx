/**
 * 任务卡片组件
 *
 * 功能说明:
 * - 用于展示单个任务的详细信息
 * - 显示任务名称、类型、创建时间、备注等信息
 * - 支持任务的完成、回滚、编辑和删除操作
 * - 展示任务的附件图片(可点击预览)
 * - 支持代码块展示,带语法高亮
 * - 根据任务状态(待办/已完成)显示不同的操作按钮
 * - 使用 Ant Design Card 组件实现
 *
 * 使用场景:
 * - 在模块分组中展示任务列表
 * - 区分待办任务和已完成任务的展示
 */
import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Tag, Space, Tooltip, Checkbox, Radio, Progress, Dropdown } from 'antd'
import { CheckOutlined, RollbackOutlined, DeleteOutlined, EditOutlined, ClockCircleOutlined, LoadingOutlined, FolderOutlined, CopyOutlined, PauseCircleOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import TaskImage from '../common/TaskImage'
import { useToast } from '../../context/ToastContext'
import styles from './TaskCard.module.css'

export default function TaskCard({ task, isCompleted, isShelved = false, taskTypeColors = {}, onComplete, onRollback, onEdit, onDelete, onImageClick, onEditModule, onShelve, onUnshelve, onCheckItemChange }) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isCodeCopied, setIsCodeCopied] = useState(false)
  const [selectedImages, setSelectedImages] = useState(new Set())
  // 记录开始拖拽前的已选中集合，用于支持增量选择
  const [initialSelectedImages, setInitialSelectedImages] = useState(new Set())
  const [isDraggingSelection, setIsDraggingSelection] = useState(false)
  const isDraggingRef = useRef(false) // 用于在 Click 事件中同步获取拖拽状态
  const [dragStartIndex, setDragStartIndex] = useState(null)
  const clickTimeoutRef = useRef(null)
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null)
  const showToast = useToast()

  // 同步 ref
  useEffect(() => {
    isDraggingRef.current = isDraggingSelection
  }, [isDraggingSelection])

  // 切换图片选择
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

  // 开始拖拽选择
  const handleMouseDown = (index) => {
    // 仅记录起始点，不立即开始选择，等待移动或松开
    setDragStartIndex(index)
    // 记录当前的选中状态，以便在拖拽过程中进行增量合并
    setInitialSelectedImages(new Set(selectedImages))
  }

  // 拖拽过程中的鼠标进入
  const handleMouseEnter = (index) => {
    // 只有按下了鼠标（dragStartIndex !== null）且移动到了新的图片（index !== dragStartIndex）才开始拖拽选择
    if (dragStartIndex !== null) {
      if (!isDraggingSelection) {
         // 首次检测到移动，进入拖拽模式
         setIsDraggingSelection(true)
      }

      const start = Math.min(dragStartIndex, index)
      const end = Math.max(dragStartIndex, index)

      // 基于初始状态进行合并/反转
      // 如果某个图片在 initialSelectedImages 中已存在，且在当前拖拽范围内，则视为反选（取消勾选）
      // 如果不在 initialSelectedImages 中，但在当前拖拽范围内，则视为选中
      const newSelected = new Set(initialSelectedImages)

      // 遍历当前拖拽范围内的所有图片
      for (let i = start; i <= end; i++) {
        if (initialSelectedImages.has(i)) {
          // 如果之前已选中，现在再次被拖拽覆盖，则取消选中
          newSelected.delete(i)
        } else {
          // 如果之前未选中，则选中
          newSelected.add(i)
        }
      }
      setSelectedImages(newSelected)
    }
  }

  // 结束拖拽（或完成单击）
  const handleMouseUp = (index) => {
    if (isDraggingSelection) {
      // 拖拽结束时，不需要清空选中状态，保留用户的所有选择

      // 延迟清除，确保 Click 事件能读到 isDraggingRef 为 true
      setTimeout(() => {
        setIsDraggingSelection(false)
        setInitialSelectedImages(new Set()) // 清空初始状态缓存
      }, 0)
    } else {
      setInitialSelectedImages(new Set()) // 清空初始状态缓存
    }
    setDragStartIndex(null)
  }

  // 全局鼠标释放，防止拖拽到外部未释放状态
  useEffect(() => {
    const handleGlobalMouseUp = () => {
        if (isDraggingSelection) {
            // 全局释放时同样不需要自动清空，保留已选内容
        }

        if (isDraggingSelection || dragStartIndex !== null) {
            // 延迟清除，确保 Click 事件能读到 isDraggingRef 为 true
            setTimeout(() => {
                setIsDraggingSelection(false)
                setDragStartIndex(null)
                setInitialSelectedImages(new Set())
            }, 0)
        }
    }
    window.addEventListener('mouseup', handleGlobalMouseUp)
    return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingSelection, dragStartIndex])

  // 处理图片点击（预览或选择）
  const handleImageClick = (e, img, images, idx) => {
    // 阻止冒泡
    e.stopPropagation()

    // 如果刚刚发生了拖拽选择，或者正在拖拽中，阻止点击事件
    if (isDraggingRef.current) {
        return
    }

    // 如果处于选择模式（已有图片被选中）
    if (selectedImages.size > 0) {
      // 引入防抖处理，区分单击和双击
      // 如果已经有定时器，说明是双击的前奏，这里先清除
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current)
        clickTimeoutRef.current = null
      }

      // 设置新的定时器，延迟执行单击逻辑
      clickTimeoutRef.current = setTimeout(() => {
        // 在选择模式下，单击图片总是触发选中/取消选中
        toggleImageSelection(null, idx)
        clickTimeoutRef.current = null
      }, 250) // 250ms 延迟
    } else {
      // 未处于选择模式，直接触发预览
      onImageClick(img, images, idx)
    }
  }

  // 处理完成任务
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

  // 处理回滚任务
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

  // 处理搁置任务
  const handleShelve = async () => {
    try {
      await onShelve(task.id)
    } catch (error) {
      showToast('搁置失败，请重试', 'error')
    }
  }

  // 处理取消搁置
  const handleUnshelve = async () => {
    try {
      await onUnshelve(task.id)
    } catch (error) {
      showToast('取消搁置失败，请重试', 'error')
    }
  }

  // 复制代码
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

  // 复制图片
  const handleCopyImage = async (img, idx) => {
    try {
      // 确定要复制的图片列表
      let imagesToCopy = []

      // 如果当前图片被选中，且还有其他图片被选中，则复制所有选中的图片
      if (selectedImages.has(idx) && selectedImages.size > 0) {
        imagesToCopy = task.images.filter((_, i) => selectedImages.has(i))
      } else {
        // 否则只复制当前这张
        imagesToCopy = [img]
      }

      if (imagesToCopy.length === 0) return

      // 1. 尝试使用 Electron 的多文件复制（如果是多张图片）
      if (imagesToCopy.length > 1 && window.electron?.clipboard?.writeFiles) {
        const filePaths = []
        let allPathsFound = true

        for (const imageSrc of imagesToCopy) {
          // 跳过 blob 和 http 图片，只处理本地文件
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

        // 如果所有图片都能找到本地路径，则使用文件复制
        if (allPathsFound && filePaths.length === imagesToCopy.length) {
          const success = await window.electron.clipboard.writeFiles(filePaths)
          if (success) {
            showToast(`已复制 ${filePaths.length} 张图片文件`)
            setSelectedImages(new Set())
            return
          }
        }
      }

      // 2. 降级处理：尝试构建 ClipboardItem
      const clipboardItems = []

      for (const imageSrc of imagesToCopy) {
          let src = imageSrc
          // 这里的逻辑参考 TaskImage 组件的处理，确保获取绝对路径
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
          clipboardItems.push(new ClipboardItem({
              [blob.type]: blob
          }))
      }

      if (clipboardItems.length > 0) {
          try {
            // 尝试写入（注意：大多数浏览器不支持多 Item 写入）
            await navigator.clipboard.write(clipboardItems)
            showToast(clipboardItems.length > 1 ? `已复制 ${clipboardItems.length} 张图片` : '图片已复制')
          } catch (err) {
            // 如果多张图片写入失败，且没有成功走文件复制逻辑，则降级为复制第一张
            if (clipboardItems.length > 1) {
              console.warn('Multiple ClipboardItems not supported, copying first one.')
              await navigator.clipboard.write([clipboardItems[0]])
              showToast('已复制第一张图片 (多图复制受限)', 'warning')
            } else {
              throw err
            }
          }
      }

      // 复制完成后清除选中状态
      setSelectedImages(new Set())
    } catch (error) {
      console.error('Copy image failed:', error)
      showToast('复制图片失败', 'error')
    }
  }

  // 处理勾选项变更
  const handleCheckItemChange = (itemId, checked) => {
    if (!onCheckItemChange) return
    const checkItems = task.checkItems
    let newItems = [...checkItems.items]

    if (checkItems.mode === 'single') {
      // 单选模式：取消其他项，只选中当前项
      newItems = newItems.map(item => ({
        ...item,
        checked: item.id === itemId ? checked : false
      }))
    } else {
      // 多选模式：支持父子联动

      // 检查是否开启了父子联动（默认为开启）
      const isLinkageEnabled = task.checkItems.linkage !== false

      if (isLinkageEnabled) {
        // 1. 更新当前项及其所有子项（向下联动）
        const updateChildren = (parentId, isChecked, items) => {
          // 查找直接子项
          items.forEach(item => {
            if (item.parentId === parentId) {
              item.checked = isChecked
              // 递归更新孙子项
              updateChildren(item.id, isChecked, items)
            }
          })
        }

        // 为了方便处理，先找到当前项，更新它
        const currentItemIndex = newItems.findIndex(item => item.id === itemId)
        if (currentItemIndex > -1) {
          newItems[currentItemIndex] = { ...newItems[currentItemIndex], checked }
          // 向下更新子节点
          updateChildren(itemId, checked, newItems)
        }

        // 2. 更新所有父级项（向上联动）
        // 检查某个父级的所有子级是否都已勾选
        const checkParentStatus = (parentId, items) => {
          const children = items.filter(item => item.parentId === parentId)
          if (children.length === 0) return false
          return children.every(item => item.checked)
        }

        // 递归向上更新
        const updateParents = (currentId, items) => {
          const currentItem = items.find(item => item.id === currentId)
          if (!currentItem || !currentItem.parentId) return

          const parentId = currentItem.parentId
          const parentIndex = items.findIndex(item => item.id === parentId)
          if (parentIndex > -1) {
            const allSiblingsChecked = checkParentStatus(parentId, items)
            // 只有状态改变时才更新
            if (items[parentIndex].checked !== allSiblingsChecked) {
              items[parentIndex] = { ...items[parentIndex], checked: allSiblingsChecked }
              // 继续向上递归
              updateParents(parentId, items)
            }
          }
        }

        // 触发向上更新
        updateParents(itemId, newItems)
      } else {
        // 不联动，只更新当前项
        const currentItemIndex = newItems.findIndex(item => item.id === itemId)
        if (currentItemIndex > -1) {
          newItems[currentItemIndex] = { ...newItems[currentItemIndex], checked }
        }
      }
    }

    onCheckItemChange(task.id, newItems)
  }

  // 计算勾选进度
  const getCheckProgress = () => {
    if (!task.checkItems?.enabled || !task.checkItems?.items?.length) return null
    const total = task.checkItems.items.length
    const checked = task.checkItems.items.filter(item => item.checked).length
    return { total, checked, percent: Math.round((checked / total) * 100) }
  }

  const checkProgress = getCheckProgress()

  return (
    <div
      style={{
        marginBottom: 16,
        background: isCompleted
          ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
          : '#ffffff',
        borderRadius: 12,
        border: isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s',
        overflow: 'hidden',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* 顶部状态条 */}
      <div style={{
        height: 4,
        background: isCompleted
          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
      }} />

      {/* 卡片内容 */}
      <div style={{ padding: '16px 20px' }}>
        {/* 头部：任务名称和类型 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          {/* 左侧：完成状态按钮 */}
          <div style={{ flexShrink: 0, paddingTop: 2 }}>
            {isCompleted ? (
              <div style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)'
              }}>
                <CheckOutlined style={{ fontSize: 14, color: '#ffffff' }} />
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
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10b981'
                  e.currentTarget.style.background = '#f0fdf4'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  e.currentTarget.style.background = '#ffffff'
                }}
              >
                {isCompleting && <LoadingOutlined style={{ fontSize: 12, color: '#10b981' }} />}
              </div>
            )}
          </div>

          {/* 中间：任务信息 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* 任务名称 */}
            <h4 style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: isCompleted ? '#64748b' : '#0f172a',
              textDecoration: isCompleted ? 'line-through' : 'none',
              lineHeight: 1.5,
              wordBreak: 'break-word'
            }}>
              {task.name}
            </h4>

            {/* 元信息行 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 6,
              flexWrap: 'wrap'
            }}>
              {/* 任务类型 */}
              {task.type && (
                <Tag
                  color={taskTypeColors[task.type] || '#3b82f6'}
                  style={{
                    margin: 0,
                    fontSize: 11,
                    padding: '2px 8px',
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {task.type}
                </Tag>
              )}

              {/* 模块标签 */}
              {!isCompleted && task.module && (
                <Tooltip title="点击修改模块">
                  <Tag
                    icon={<FolderOutlined style={{ fontSize: 10 }} />}
                    onClick={() => onEditModule && onEditModule(task)}
                    style={{
                      margin: 0,
                      fontSize: 11,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#64748b',
                      borderRadius: 4,
                      fontWeight: 500,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.color = '#3b82f6'
                      e.currentTarget.style.background = '#eff6ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0'
                      e.currentTarget.style.color = '#64748b'
                      e.currentTarget.style.background = '#f8fafc'
                    }}
                  >
                    {task.module}
                  </Tag>
                </Tooltip>
              )}

              {/* 创建时间 */}
              <span style={{
                fontSize: 11,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 4
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

          {/* 右侧：操作按钮 */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 4 }}>
            {isCompleted ? (
              <Tooltip title="回滚任务">
                <Button
                  type="text"
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={handleRollback}
                  loading={isRollingBack}
                  style={{
                    color: '#64748b',
                    width: 28,
                    height: 28,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
                      color: '#3b82f6',
                      width: 28,
                      height: 28,
                      padding: 0
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(task)}
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0
                    }}
                  />
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip title="搁置">
                  <Button
                    type="text"
                    size="small"
                    icon={<PauseCircleOutlined />}
                    onClick={handleShelve}
                    style={{
                      color: '#f59e0b',
                      width: 28,
                      height: 28,
                      padding: 0
                    }}
                  />
                </Tooltip>
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(task)}
                    style={{
                      color: '#3b82f6',
                      width: 28,
                      height: 28,
                      padding: 0
                    }}
                  />
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(task)}
                    style={{
                      width: 28,
                      height: 28,
                      padding: 0
                    }}
                  />
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* 备注区域 */}
        {task.remark && (
          <div style={{
            padding: 12,
            background: '#f8fafc',
            borderRadius: 8,
            fontSize: 13,
            marginTop: 12,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: '1px solid #e2e8f0',
            color: '#475569',
            lineHeight: 1.6
          }}>
            {task.remark}
          </div>
        )}

        {/* 勾选项显示 */}
        {task.checkItems?.enabled && task.checkItems?.items?.length > 0 && (
          <div style={{
            marginTop: 12,
            padding: 12,
            background: '#fafafa',
            borderRadius: 8,
            border: '1px solid #e2e8f0'
          }}>
            {/* 勾选项头部 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <div style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: checkProgress?.percent === 100 ? '#10b981' : '#3b82f6'
                }} />
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#0f172a'
                }}>
                  {task.checkItems.mode === 'single' ? '单选项' : '检查清单'}
                </span>
              </div>
              {checkProgress && (
                <span style={{
                  fontSize: 11,
                  color: '#64748b',
                  fontWeight: 500
                }}>
                  {checkProgress.checked}/{checkProgress.total}
                </span>
              )}
            </div>

            {/* 进度条 */}
            {checkProgress && (
              <Progress
                percent={checkProgress.percent}
                size="small"
                strokeColor={checkProgress.percent === 100 ? '#10b981' : '#3b82f6'}
                trailColor="#e2e8f0"
                showInfo={false}
                style={{ marginBottom: 10 }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(() => {
                // 递归渲染函数
                const renderCheckItems = (parentId = null, level = 0) => {
                  // 找到当前层级的项
                  const currentLevelItems = task.checkItems.items.filter(item =>
                    // 兼容旧数据：如果没有 parentId 属性，视为空
                    (item.parentId || null) === parentId
                  )

                  if (currentLevelItems.length === 0) return null

                  return currentLevelItems.map(item => (
                    <div key={item.id} style={{ marginLeft: level * 20 }}>
                      {task.checkItems.mode === 'single' ? (
                        <div>
                          <Radio
                            value={item.id}
                            style={{ fontSize: 13 }}
                            disabled={isCompleted}
                            checked={item.checked}
                            onChange={(e) => handleCheckItemChange(item.id, true)}
                          >
                            {item.name}
                          </Radio>
                          {/* 备注单独一行显示 */}
                          {item.remark && (
                            <div style={{
                              marginLeft: 24,
                              marginTop: 2,
                              fontSize: 12,
                              color: '#8c8c8c',
                              lineHeight: 1.4
                            }}>
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
                              color: item.checked ? '#8c8c8c' : 'inherit'
                            }}>
                              {item.name}
                            </span>
                          </Checkbox>
                          {/* 备注单独一行显示 */}
                          {item.remark && (
                            <div style={{
                              marginLeft: 24,
                              marginTop: 2,
                              fontSize: 12,
                              color: '#8c8c8c',
                              lineHeight: 1.4
                            }}>
                              {item.remark}
                            </div>
                          )}
                        </div>
                      )}
                      {/* 递归渲染子项 */}
                      {renderCheckItems(item.id, level + 1)}
                    </div>
                  ))
                }

                return task.checkItems.mode === 'single' ? (
                  // 单选模式外层包裹 Radio.Group (虽然我们递归手动控制了checked，但为了保持 Radio 互斥样式的正确性，
                  // 这里可能需要调整。由于 Antd Radio.Group 不支持嵌套太深且容易样式混乱，
                  // 我们这里改为直接使用受控 Radio，不包裹 Radio.Group，或者只在最外层包裹。
                  // 鉴于树形结构，Radio.Group 可能不适合，直接用受控 Radio 更灵活)
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {renderCheckItems()}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {renderCheckItems()}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {task.images && task.images.length > 0 && (
          <div
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}
            onMouseLeave={() => handleMouseUp()}
          >
            {task.images.map((img, idx) => (
              <Dropdown
                key={idx}
                menu={{
                  items: [
                    {
                      key: 'copy',
                      label: (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span>复制图片</span>
                          <span style={{ fontSize: '10px', color: '#999' }}>图片可拖动实现多选</span>
                        </div>
                      ),
                      icon: <CopyOutlined />,
                      onClick: () => handleCopyImage(img, idx)
                    }
                  ]
                }}
                trigger={['contextMenu']}
              >
                <div
                  className={`${styles.taskImageWrapper} ${selectedImages.has(idx) ? styles.selected : ''}`}
                  onClick={(e) => handleImageClick(e, img, task.images, idx)}
                  onMouseDown={(e) => {
                      if (e.button === 0) { // 仅左键处理拖动选择
                          e.preventDefault() // 防止触发原生拖拽
                          handleMouseDown(idx)
                      }
                  }}
                  onMouseEnter={() => {
                    handleMouseEnter(idx)
                    setHoveredImageIndex(idx)
                  }}
                  onMouseLeave={() => setHoveredImageIndex(null)}
                  onMouseUp={() => handleMouseUp(idx)}
                  onDoubleClick={(e) => {
                    if (selectedImages.size > 0) {
                      e.stopPropagation()
                      // 双击事件触发时，清除单击定时器，阻止单击逻辑执行
                      if (clickTimeoutRef.current) {
                        clearTimeout(clickTimeoutRef.current)
                        clickTimeoutRef.current = null
                      }
                      onImageClick(img, task.images, idx)
                    }
                  }}
                  style={{
                    width: 100,
                    height: 100,
                    overflow: 'hidden',
                    border: '1px solid #d9d9d9'
                  }}
                >
                  <div
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ position: 'absolute', top: 4, left: 4, zIndex: 10 }}
                  >
                    {/* 选中时显示，或者有选中项且悬浮时显示 */}
                    <Checkbox
                      className={styles.taskImageCheckbox}
                      checked={selectedImages.has(idx)}
                      onClick={(e) => toggleImageSelection(e, idx)}
                      style={{
                        position: 'static',
                        opacity: selectedImages.has(idx) || (selectedImages.size > 0 && hoveredImageIndex === idx) ? 1 : 0,
                        pointerEvents: selectedImages.has(idx) || (selectedImages.size > 0 && hoveredImageIndex === idx) ? 'auto' : 'none'
                      }}
                    />
                  </div>
                  <TaskImage
                    src={img}
                    alt={`附件${idx + 1}`}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', userSelect: 'none' }}
                  />
                </div>
              </Dropdown>
            ))}
          </div>
        )}

        {/* 代码块显示 */}
        {task.codeBlock?.enabled && task.codeBlock?.code && (
          <div style={{ marginBottom: 8 }}>
            <div style={{
              background: '#1e1e1e',
              color: '#fff',
              padding: '4px 12px',
              fontSize: 12,
              borderTopLeftRadius: 4,
              borderTopRightRadius: 4,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{task.codeBlock.language || 'text'}</span>
              <Tooltip title={isCodeCopied ? "已复制" : "复制代码"}>
                <Button
                  type="text"
                  size="small"
                  icon={isCodeCopied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined style={{ color: '#fff' }} />}
                  onClick={handleCopyCode}
                  style={{
                    color: '#fff',
                    height: '20px',
                    padding: '0 4px',
                    minWidth: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                />
              </Tooltip>
            </div>
            <div style={{ borderRadius: '0 0 4px 4px', overflow: 'hidden' }}>
              <SyntaxHighlighter
                language={task.codeBlock.language || 'text'}
                style={vscDarkPlus}
                className={styles.taskCodeBlockContent}
                customStyle={{
                  margin: 0,
                  borderRadius: 0,
                  fontSize: '13px'
                }}
                wrapLongLines={false}
              >
                {task.codeBlock.code}
              </SyntaxHighlighter>
            </div>
          </div>
        )}


      </div>
    </Card>
  )
}
