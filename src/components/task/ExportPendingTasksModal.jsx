/**
 * 导出未完成任务模态框组件
 * 
 * 功能说明:
 * - 选择要导出的模块（只显示有未完成任务的模块）
 * - 支持模块级别全选和任务级别单选
 * - 选择导出格式（Excel或Markdown）
 * - 导出选中的未完成任务
 */
import React, { useState, useEffect } from 'react'
import { Modal, Checkbox, Button, Empty, Radio, Space, Collapse } from 'antd'
import { FileExcelOutlined, FileMarkdownOutlined, CaretRightOutlined } from '@ant-design/icons'
import styles from './ExportPendingTasksModal.module.css'

export default function ExportPendingTasksModal({
    show,
    modules = [],
    pendingTasks = [],
    onConfirm,
    onCancel
}) {
    // 选中的任务ID集合
    const [selectedTaskIds, setSelectedTaskIds] = useState(new Set())
    const [exportFormat, setExportFormat] = useState('excel')

    // 获取指定模块的未完成任务列表
    const getModulePendingTasks = (moduleName) => {
        return pendingTasks.filter(task => task.module === moduleName)
    }

    // 过滤出有未完成任务的模块
    const modulesWithTasks = modules.filter(m => getModulePendingTasks(m.name).length > 0)

    // 重置选择状态
    useEffect(() => {
        if (show) {
            // 默认选中所有未完成任务
            const allTaskIds = new Set(pendingTasks.map(task => task.id))
            setSelectedTaskIds(allTaskIds)
            // 默认导出格式为Excel
            setExportFormat('excel')
        }
    }, [show, pendingTasks])

    // 处理全选所有任务
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedTaskIds(new Set(pendingTasks.map(task => task.id)))
        } else {
            setSelectedTaskIds(new Set())
        }
    }

    // 处理模块级别全选
    const handleModuleSelectAll = (moduleName, checked) => {
        const moduleTasks = getModulePendingTasks(moduleName)
        const newSelectedIds = new Set(selectedTaskIds)

        if (checked) {
            moduleTasks.forEach(task => newSelectedIds.add(task.id))
        } else {
            moduleTasks.forEach(task => newSelectedIds.delete(task.id))
        }

        setSelectedTaskIds(newSelectedIds)
    }

    // 处理单个任务选择
    const handleTaskChange = (taskId, checked) => {
        const newSelectedIds = new Set(selectedTaskIds)
        if (checked) {
            newSelectedIds.add(taskId)
        } else {
            newSelectedIds.delete(taskId)
        }
        setSelectedTaskIds(newSelectedIds)
    }

    // 检查模块是否全选
    const isModuleAllSelected = (moduleName) => {
        const moduleTasks = getModulePendingTasks(moduleName)
        return moduleTasks.length > 0 && moduleTasks.every(task => selectedTaskIds.has(task.id))
    }

    // 检查模块是否部分选中
    const isModuleIndeterminate = (moduleName) => {
        const moduleTasks = getModulePendingTasks(moduleName)
        const selectedCount = moduleTasks.filter(task => selectedTaskIds.has(task.id)).length
        return selectedCount > 0 && selectedCount < moduleTasks.length
    }

    // 确认导出
    const handleConfirm = () => {
        // 将选中的任务按模块分组，返回模块名称列表和选中的任务ID列表
        const selectedTasks = pendingTasks.filter(task => selectedTaskIds.has(task.id))
        const selectedModuleNames = [...new Set(selectedTasks.map(task => task.module))]
        onConfirm(selectedModuleNames, exportFormat, Array.from(selectedTaskIds))
    }

    // 计算全选状态
    const isAllSelected = pendingTasks.length > 0 && selectedTaskIds.size === pendingTasks.length
    const isIndeterminate = selectedTaskIds.size > 0 && selectedTaskIds.size < pendingTasks.length

    // 获取模块已选中任务数
    const getModuleSelectedCount = (moduleName) => {
        const moduleTasks = getModulePendingTasks(moduleName)
        return moduleTasks.filter(task => selectedTaskIds.has(task.id)).length
    }

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {exportFormat === 'excel' ?
                        <FileExcelOutlined style={{ color: '#52c41a' }} /> :
                        <FileMarkdownOutlined style={{ color: '#1890ff' }} />
                    }
                    <span>导出未完成任务</span>
                </div>
            }
            open={show}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    取消
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    onClick={handleConfirm}
                    disabled={selectedTaskIds.size === 0}
                    style={{
                        background: exportFormat === 'excel' ? '#52c41a' : '#1890ff',
                        borderColor: exportFormat === 'excel' ? '#52c41a' : '#1890ff'
                    }}
                >
                    导出
                </Button>
            ]}
            width={500}
        >
            {modulesWithTasks.length === 0 ? (
                <Empty description="暂无未完成任务" />
            ) : (
                <div>
                    {/* 导出格式选择 */}
                    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>导出格式：</div>
                        <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                            <Space>
                                <Radio value="excel">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <FileExcelOutlined style={{ color: '#52c41a' }} />
                                        Excel
                                    </span>
                                </Radio>
                                <Radio value="markdown">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <FileMarkdownOutlined style={{ color: '#1890ff' }} />
                                        Markdown
                                    </span>
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                    {/* 全选所有任务 */}
                    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                        <Checkbox
                            checked={isAllSelected}
                            indeterminate={isIndeterminate}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        >
                            全选所有任务
                        </Checkbox>
                    </div>
                    {/* 模块和任务选择 */}
                    <div className={styles.taskListContainer}>
                        <Collapse
                            ghost
                            expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                            defaultActiveKey={[]}
                        >
                            {modulesWithTasks.map(module => {
                                const moduleTasks = getModulePendingTasks(module.name)
                                const selectedCount = getModuleSelectedCount(module.name)
                                return (
                                    <Collapse.Panel
                                        key={module.id}
                                        header={
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Checkbox
                                                    checked={isModuleAllSelected(module.name)}
                                                    indeterminate={isModuleIndeterminate(module.name)}
                                                    onChange={(e) => {
                                                        e.stopPropagation()
                                                        handleModuleSelectAll(module.name, e.target.checked)
                                                    }}
                                                />
                                                <span style={{ fontWeight: 500 }}>{module.name}</span>
                                                <span style={{
                                                    fontSize: 12,
                                                    padding: '0 6px',
                                                    borderRadius: 10,
                                                    background: '#faad14',
                                                    color: '#fff',
                                                    fontWeight: 500
                                                }}>
                                                    {selectedCount}/{moduleTasks.length}
                                                </span>
                                            </div>
                                        }
                                    >
                                        <div style={{ paddingLeft: 32 }}>
                                            {moduleTasks.map(task => (
                                                <div key={task.id} style={{ marginBottom: 6 }}>
                                                    <Checkbox
                                                        checked={selectedTaskIds.has(task.id)}
                                                        onChange={(e) => handleTaskChange(task.id, e.target.checked)}
                                                    >
                                                        <span style={{
                                                            color: '#595959',
                                                            wordBreak: 'break-all'
                                                        }}>
                                                            {task.name}
                                                        </span>
                                                    </Checkbox>
                                                </div>
                                            ))}
                                        </div>
                                    </Collapse.Panel>
                                )
                            })}
                        </Collapse>
                    </div>
                    <div style={{ marginTop: 16, color: '#8c8c8c', fontSize: 12 }}>
                        已选择 {selectedTaskIds.size} / {pendingTasks.length} 个任务
                    </div>
                </div>
            )}
        </Modal>
    )
}
