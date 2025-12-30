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
import React, { useState } from 'react'
import { Card, Button, Tag, Space, Tooltip, message, Checkbox, Radio, Progress } from 'antd'
import { CheckOutlined, RollbackOutlined, DeleteOutlined, EditOutlined, ClockCircleOutlined, LoadingOutlined, FolderOutlined, CopyOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import TaskImage from '../common/TaskImage'
import styles from './TaskCard.module.css'

export default function TaskCard({ task, isCompleted, isShelved = false, taskTypeColors = {}, onComplete, onRollback, onEdit, onDelete, onImageClick, onEditModule, onShelve, onUnshelve, onCheckItemChange }) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [isCodeCopied, setIsCodeCopied] = useState(false)

  // 处理完成任务
  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await onComplete(task.id)
    } catch (error) {
      message.error('操作失败，请重试')
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
      message.error('操作失败，请重试')
    } finally {
      setTimeout(() => setIsRollingBack(false), 300)
    }
  }

  // 处理搁置任务
  const handleShelve = async () => {
    try {
      await onShelve(task.id)
    } catch (error) {
      message.error('搁置失败，请重试')
    }
  }

  // 处理取消搁置
  const handleUnshelve = async () => {
    try {
      await onUnshelve(task.id)
    } catch (error) {
      message.error('取消搁置失败，请重试')
    }
  }

  // 复制代码
  const handleCopyCode = async () => {
    if (!task.codeBlock?.code) return
    try {
      await navigator.clipboard.writeText(task.codeBlock.code)
      setIsCodeCopied(true)
      message.success('代码已复制')
      setTimeout(() => setIsCodeCopied(false), 2000)
    } catch (error) {
      message.error('复制失败')
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
      // 多选模式：直接更新当前项
      newItems = newItems.map(item =>
        item.id === itemId ? { ...item, checked } : item
      )
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
                        <Radio
                          value={item.id}
                          style={{ fontSize: 13 }}
                          disabled={isCompleted}
                          checked={item.checked}
                          onChange={(e) => handleCheckItemChange(item.id, true)}
                        >
                          {item.name}
                        </Radio>
                      ) : (
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {task.images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => onImageClick(img, task.images, idx)}
                style={{
                  cursor: 'pointer',
                  width: 100,
                  height: 100,
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid #d9d9d9'
                }}
              >
                <TaskImage
                  src={img}
                  alt={`附件${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
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
