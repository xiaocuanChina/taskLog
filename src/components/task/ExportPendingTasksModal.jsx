/**
 * 导出未完成任务模态框组件
 * 
 * 功能说明:
 * - 选择要导出的模块
 * - 选择导出格式（Excel或Markdown）
 * - 导出选中模块的未完成任务
 */
import React, { useState, useEffect } from 'react'
import { Modal, Checkbox, Button, Empty, Radio, Space } from 'antd'
import { FileExcelOutlined, FileMarkdownOutlined } from '@ant-design/icons'

export default function ExportPendingTasksModal({
    show,
    modules = [],
    pendingTasks = [],
    onConfirm,
    onCancel
}) {
    const [selectedModules, setSelectedModules] = useState([])
    const [exportFormat, setExportFormat] = useState('excel')

    // 计算每个模块的未完成任务数量
    const getModulePendingCount = (moduleName) => {
        return pendingTasks.filter(task => task.module === moduleName).length
    }

    // 重置选择状态
    useEffect(() => {
        if (show) {
            // 默认只选中有未完成任务的模块
            const modulesWithPendingTasks = modules
                .filter(m => getModulePendingCount(m.name) > 0)
                .map(m => m.name)
            setSelectedModules(modulesWithPendingTasks)
            // 默认导出格式为Excel
            setExportFormat('excel')
        }
    }, [show, modules, pendingTasks])

    // 处理全选（只选择有未完成任务的模块）
    const handleSelectAll = (checked) => {
        if (checked) {
            const modulesWithPendingTasks = modules
                .filter(m => getModulePendingCount(m.name) > 0)
                .map(m => m.name)
            setSelectedModules(modulesWithPendingTasks)
        } else {
            setSelectedModules([])
        }
    }

    // 处理单个模块选择
    const handleModuleChange = (moduleName, checked) => {
        if (checked) {
            setSelectedModules([...selectedModules, moduleName])
        } else {
            setSelectedModules(selectedModules.filter(m => m !== moduleName))
        }
    }

    // 确认导出
    const handleConfirm = () => {
        onConfirm(selectedModules, exportFormat)
    }

    // 有未完成任务的模块列表
    const modulesWithTasks = modules.filter(m => getModulePendingCount(m.name) > 0)
    const isAllSelected = modulesWithTasks.length > 0 && selectedModules.length === modulesWithTasks.length
    const isIndeterminate = selectedModules.length > 0 && selectedModules.length < modulesWithTasks.length

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
                    disabled={selectedModules.length === 0}
                    style={{
                        background: exportFormat === 'excel' ? '#52c41a' : '#1890ff',
                        borderColor: exportFormat === 'excel' ? '#52c41a' : '#1890ff'
                    }}
                >
                    导出
                </Button>
            ]}
            width={400}
        >
            {modules.length === 0 ? (
                <Empty description="暂无模块" />
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
                    {/* 模块选择 */}
                    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
                        <Checkbox
                            checked={isAllSelected}
                            indeterminate={isIndeterminate}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                        >
                            全选模块
                        </Checkbox>
                    </div>
                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                        {modules.map(module => {
                            const pendingCount = getModulePendingCount(module.name)
                            return (
                                <div key={module.id} style={{ marginBottom: 8 }}>
                                    <Checkbox
                                        checked={selectedModules.includes(module.name)}
                                        onChange={(e) => handleModuleChange(module.name, e.target.checked)}
                                        disabled={pendingCount === 0}
                                    >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                            {module.name}
                                            <span style={{
                                                fontSize: 12,
                                                padding: '0 6px',
                                                borderRadius: 10,
                                                background: pendingCount > 0 ? '#faad14' : '#d9d9d9',
                                                color: '#fff',
                                                fontWeight: 500
                                            }}>
                                                {pendingCount}
                                            </span>
                                        </span>
                                    </Checkbox>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{ marginTop: 16, color: '#8c8c8c', fontSize: 12 }}>
                        已选择 {selectedModules.length} / {modules.length} 个模块
                    </div>
                </div>
            )}
        </Modal>
    )
}
