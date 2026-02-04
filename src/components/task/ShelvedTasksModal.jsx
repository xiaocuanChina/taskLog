/**
 * 搁置任务模态框组件
 * 
 * 功能说明:
 * - 以弹框形式展示搁置的任务列表
 * - 支持取消搁置操作
 * - 支持查看任务详情
 * - 支持按标题和备注搜索任务
 */
import React, { useState, useMemo } from 'react'
import { Modal, Empty, Badge, Input } from 'antd'
import { PauseCircleOutlined, SearchOutlined } from '@ant-design/icons'
import TaskCard from './TaskCard'

// 滚动条样式
const scrollbarStyles = `
    .shelved-tasks-content::-webkit-scrollbar {
        width: 8px;
    }
    .shelved-tasks-content::-webkit-scrollbar-track {
        background: #f5f5f5;
        border-radius: 10px;
    }
    .shelved-tasks-content::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #faad14 0%, #d48806 100%);
        border-radius: 10px;
    }
    .shelved-tasks-content::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #ffc53d 0%, #faad14 100%);
    }
`

export default function ShelvedTasksModal({
    show,
    shelvedTasks = [],
    taskTypeColors = {},
    onTaskComplete,
    onTaskRollback,
    onTaskEdit,
    onTaskDelete,
    onImageClick,
    onTaskUnshelve,
    onCheckItemChange,
    onClose
}) {
    // 搜索关键词状态
    const [searchKeyword, setSearchKeyword] = useState('')

    // 根据搜索关键词过滤任务
    const filteredTasks = useMemo(() => {
        if (!searchKeyword.trim()) {
            return shelvedTasks
        }
        
        const keyword = searchKeyword.toLowerCase()
        return shelvedTasks.filter(task => {
            const titleMatch = task.name?.toLowerCase().includes(keyword)
            const remarkMatch = task.remark?.toLowerCase().includes(keyword)
            return titleMatch || remarkMatch
        })
    }, [shelvedTasks, searchKeyword])

    // 关闭模态框时重置搜索条件
    const handleClose = () => {
        setSearchKeyword('')
        onClose()
    }

    return (
        <Modal
            open={show}
            onCancel={handleClose}
            footer={null}
            width={700}
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PauseCircleOutlined style={{ color: '#faad14' }} />
                    <span>搁置任务</span>
                    <Badge
                        count={shelvedTasks.length}
                        style={{ backgroundColor: '#faad14' }}
                    />
                </div>
            }
            styles={{
                body: {
                    padding: '16px'
                }
            }}
        >
            <style>{scrollbarStyles}</style>
            
            {/* 搜索框 */}
            <Input
                placeholder="搜索标题或备注..."
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                allowClear
                style={{ marginBottom: 16 }}
            />

            {filteredTasks.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={searchKeyword ? "未找到匹配的任务" : "暂无搁置的任务"}
                />
            ) : (
                <div
                    className="shelved-tasks-content"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        maxHeight: '55vh',
                        overflowY: 'auto',
                        paddingRight: 8
                    }}
                >
                    {filteredTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isCompleted={false}
                            isShelved={true}
                            taskTypeColors={taskTypeColors}
                            onComplete={onTaskComplete}
                            onRollback={onTaskRollback}
                            onEdit={onTaskEdit}
                            onDelete={onTaskDelete}
                            onImageClick={onImageClick}
                            onUnshelve={onTaskUnshelve}
                            onCheckItemChange={onCheckItemChange}
                        />
                    ))}
                </div>
            )}
        </Modal>
    )
}
