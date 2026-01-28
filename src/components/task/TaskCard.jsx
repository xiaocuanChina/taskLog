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
import { CheckOutlined, RollbackOutlined, DeleteOutlined, EditOutlined, ClockCircleOutlined, LoadingOutlined, FolderOutlined, CopyOutlined, PauseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons'
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
  const [isDraggingSelection, setIsDraggingSelection] = useState(false)
  const isDraggingRef = useRef(false) // 用于在 Click 事件中同步获取拖拽状态
  const [dragStartIndex, setDragStartIndex] = useState(null)
  const [clickTimeout, setClickTimeout] = useState(null)
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null)
  const showToast = useToast()

  // 同步 ref
  useEffect(() => {
    isDraggingRef.current = isDraggingSelection
  }, [isDraggingSelection])

  // 切换图片选择
  const toggleImageSelection = (e, index) => {
    e.stopPropagation()
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
    // 也不立即清除选中，因为可能是点击已选中的图片
    // 只有在确定是单击且未选中时，或者开始拖拽时，才清除
  }

  // 拖拽过程中的鼠标进入
  const handleMouseEnter = (index) => {
    // 只有按下了鼠标（dragStartIndex !== null）且移动到了新的图片（index !== dragStartIndex）才开始拖拽选择
    if (dragStartIndex !== null) {
      if (!isDraggingSelection) {
         // 首次检测到移动，进入拖拽模式
         setIsDraggingSelection(true)
      }
      
      // 用户反馈：拖动选中 a,b,c 后又拖回 a，需要更新选中范围
      // 这里的逻辑已经是计算 start 到 end 的范围，所以是支持“拖回”的。
      // 只要 dragStartIndex 不变，current index 变了，范围就会重算。
      // 例如 start=0, current=2 -> [0,1,2]
      // 拖回 start=0, current=0 -> [0]
      // 所以核心逻辑不用变，只需要确保每次都重新计算并覆盖。
      
      const start = Math.min(dragStartIndex, index)
      const end = Math.max(dragStartIndex, index)
      
      const newSelected = new Set()
      // 选中范围内所有的图片
      for (let i = start; i <= end; i++) {
        newSelected.add(i)
      }
      setSelectedImages(newSelected)
    }
  }

  // 结束拖拽（或完成单击）
  const handleMouseUp = (index) => {
    if (isDraggingSelection) {
      // 如果是拖拽结束，什么都不做，保留当前选中状态
      setIsDraggingSelection(false)
    } else {
      // 如果没有发生拖拽（即单纯的点击）
      if (dragStartIndex !== null && index !== undefined) {
         // 只有当点击的是未选中的图片时，才清除其他并选中当前
         if (!selectedImages.has(index)) {
              // 延时处理单击选中，以便检测是否为双击
              if (clickTimeout) {
                  clearTimeout(clickTimeout)
              }
              
              const timeoutId = setTimeout(() => {
                  // 单击选中一张
                  setSelectedImages(new Set([index]))
                  setClickTimeout(null)
              }, 200) // 200ms 延时，通常足够区分双击
              
              setClickTimeout(timeoutId)
          } else {
              // 用户反馈：拖动选中a,b,c后又拖回a，图片a会展示大图，不需要这样
              // 这里的逻辑是处理 MouseUp，如果发生了拖动（isDraggingSelection=true），则进不到这里。
              // 如果用户只是点了一下已选中的图片，这里会触发。
              // 但用户说的是“拖动...又拖回a”，这时候 isDraggingSelection 应该是 true。
              // 如果 isDraggingSelection 是 false，说明用户没有拖动到别的图片上。
              // 可能是 dragStartIndex === index，所以 mouseEnter 没有触发 isDraggingSelection=true？
              // 让我们检查 handleMouseEnter。
              // 如果 start === end，mouseenter 也会触发。
              // 但如果用户只是在当前图片内微小移动，算不算拖拽？
              // 关键是：如果用户拖出去了又拖回来，isDraggingSelection 应该是 true。
              // 那么在 handleMouseUp 中应该走 if (isDraggingSelection) 分支。
              // 在那个分支里，我们只 setIsDraggingSelection(false)，不触发预览。
              
              // 那么为什么会展示大图？
              // 预览逻辑在 onClick (handleImageClick) 或 onDoubleClick 中。
              // 我们之前的修改中，onDoubleClick 负责预览。
              // handleImageClick 中也保留了双击预览（通过延时清除）。
              // 问题可能出在：拖动操作结束后，是否触发了 onClick？
              // 浏览器的 Click 事件是在 MouseDown + MouseUp 后触发的。
              // 如果我们在同一个元素上 MouseDown 然后 MouseUp，就会触发 Click。
              // 即使中间鼠标跑出去过又回来了。
              // 所以我们需要在 Click 处理中判断是否刚刚发生了拖拽。
          }
       }
     }
     setDragStartIndex(null)
     // 注意：这里没有清除 isDraggingSelection，因为它在 Click 中可能用到
     // 但为了状态安全，我们在 Click 中判断，或者延迟清除？
     // 实际上 handleMouseUp 执行完，React 状态更新可能是异步的。
     // 更好的方式是用 useRef 记录 isDragging 状态，供 Click 判断。
  }

  // 全局鼠标释放，防止拖拽到外部未释放状态
  useEffect(() => {
    const handleGlobalMouseUp = () => {
        if (isDraggingSelection || dragStartIndex !== null) {
            setIsDraggingSelection(false)
            setDragStartIndex(null)
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

    // 如果发生了双击，清除之前的单击延时选中
    if (clickTimeout) {
        clearTimeout(clickTimeout)
        setClickTimeout(null)
    }
    
    // 单击不再触发预览，只在 DoubleClick 中触发
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
    <Card
      size="small"
      style={{
        marginBottom: 12,
        opacity: isCompleted ? 0.7 : 1,
        borderLeft: isCompleted ? '4px solid #52c41a' : '4px solid #1890ff',
        position: 'relative'
      }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '4px' }}>
          {/* 左侧：占位 */}
          <div style={{ width: 32 }} />

          {/* 中间：完成/回滚按钮 */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            {isCompleted ? (
              <Button
                type="default"
                size="middle"
                icon={isRollingBack ? <LoadingOutlined /> : <RollbackOutlined />}
                onClick={handleRollback}
                loading={isRollingBack}
                disabled={isRollingBack}
                style={{
                  minWidth: 100,
                  fontWeight: 600,
                  fontSize: 14,
                  transform: isRollingBack ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {isRollingBack ? '回滚中...' : '回滚'}
              </Button>
            ) : (
              <Button
                type="primary"
                size="middle"
                icon={isCompleting ? <LoadingOutlined /> : <CheckOutlined style={{ fontSize: 16 }} />}
                onClick={handleComplete}
                loading={isCompleting}
                disabled={isCompleting}
                style={{
                  background: isCompleting
                    ? 'linear-gradient(135deg, #73d13d 0%, #95de64 100%)'
                    : 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                  borderColor: '#52c41a',
                  minWidth: 100,
                  fontWeight: 600,
                  fontSize: 14,
                  boxShadow: isCompleting
                    ? '0 4px 12px rgba(82, 196, 26, 0.5)'
                    : '0 2px 8px rgba(82, 196, 26, 0.3)',
                  height: 32,
                  transform: isCompleting ? 'scale(0.95)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.92)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {isCompleting ? '完成中...' : '完成'}
              </Button>
            )}
          </div>

          {/* 右侧：编辑、搁置和删除按钮（仅待办任务显示） */}
          {!isCompleted && !isShelved ? (
            <Space size={4}>
              <Tooltip title="搁置任务">
                <Button
                  type="text"
                  size="small"
                  icon={<PauseCircleOutlined />}
                  onClick={handleShelve}
                  style={{ color: '#faad14' }}
                />
              </Tooltip>
              <Tooltip title="编辑任务">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(task)}
                />
              </Tooltip>
              <Tooltip title="删除任务">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(task)}
                />
              </Tooltip>
            </Space>
          ) : isShelved ? (
            <Space size={4}>
              <Tooltip title="取消搁置">
                <Button
                  type="text"
                  size="small"
                  icon={<RollbackOutlined />}
                  onClick={handleUnshelve}
                  style={{ color: '#1890ff' }}
                />
              </Tooltip>
              <Tooltip title="删除任务">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(task)}
                />
              </Tooltip>
            </Space>
          ) : (
            <div style={{ width: 64 }} />
          )}
        </div>
      }
    >
      <div>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {task.type && (
            <Tag color={taskTypeColors[task.type] || '#1890ff'} style={{ margin: 0, fontSize: 13, padding: '2px 10px' }}>
              {task.type}
            </Tag>
          )}
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, flex: 1 }}>{task.name}</h4>
          {!isCompleted && task.module && (
            <Tooltip title="修改所属模块">
              <Tag
                icon={<FolderOutlined />}
                color="default"
                style={{
                  margin: 0,
                  fontSize: 12,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  border: '1px solid #d9d9d9'
                }}
                onClick={() => onEditModule && onEditModule(task)}
              >
                {task.module}
              </Tag>
            </Tooltip>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClockCircleOutlined />
          创建于 {new Date(task.createdAt).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>

        {task.remark && (
          <div style={{
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: 4,
            fontSize: 13,
            marginBottom: 8,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>📝 备注：</div>
            <div>{task.remark}</div>
          </div>
        )}

        {/* 勾选项显示 */}
        {task.checkItems?.enabled && task.checkItems?.items?.length > 0 && (
          <div style={{
            padding: '8px 12px',
            background: '#fafafa',
            borderRadius: 4,
            marginBottom: 8,
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>
                ✅ 勾选项 ({task.checkItems.mode === 'single' ? '单选' : '多选'})
              </span>
              {checkProgress && (
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {checkProgress.checked}/{checkProgress.total}
                </span>
              )}
            </div>
            {checkProgress && (
              <Progress
                percent={checkProgress.percent}
                size="small"
                style={{ marginBottom: 8 }}
                strokeColor={checkProgress.percent === 100 ? '#52c41a' : '#1890ff'}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>复制图片</span>
                          <Tooltip title="图片可拖动多选复制">
                            <QuestionCircleOutlined 
                              style={{ marginLeft: 8, color: '#999', fontSize: '12px' }} 
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Tooltip>
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
                  onDoubleClick={() => onImageClick(img, task.images, idx)}
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
                        opacity: selectedImages.size > 1 && (selectedImages.has(idx) || hoveredImageIndex === idx) ? 1 : 0,
                        pointerEvents: selectedImages.size > 1 && (selectedImages.has(idx) || hoveredImageIndex === idx) ? 'auto' : 'none'
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
