/**
 * 搁置任务模态框组件
 * 
 * 功能说明:
 * - 以弹框形式展示搁置的任务列表
 * - 支持取消搁置操作
 * - 支持查看任务详情
 */
import React from 'react'
import { Modal, Empty, Badge } from 'antd'
import { PauseCircleOutlined } from '@ant-design/icons'
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
    return (
        <Modal
            open={show}
            onCancel={onClose}
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
            {shelvedTasks.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无搁置的任务"
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
                    {shelvedTasks.map(task => (
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
