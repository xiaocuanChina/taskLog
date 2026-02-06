/**
 * 导出未完成任务模态框组件
 * 
 * 功能说明:
 * - 选择要导出的模块（只显示有未完成任务的模块）
 * - 支持模块级别全选和任务级别单选
 * - 选择导出格式（Excel或Markdown）
 * - 导出选中的未完成任务
 * 
 * 优化内容:
 * - 改进视觉层次和布局结构
 * - 增强交互反馈和动画效果
 * - 优化暗色/亮色主题适配
 * - 提升用户体验和可访问性
 */
import { useState, useEffect, useMemo } from 'react'
import { Modal, Checkbox, Button, Empty, Radio, Collapse, Badge } from 'antd'
import { 
    FileExcelOutlined, 
    FileMarkdownOutlined, 
    CaretRightOutlined,
    CheckCircleOutlined,
    FolderOutlined,
    FileTextOutlined
} from '@ant-design/icons'
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

    // 使用 useMemo 优化性能
    const modulesWithTasks = useMemo(() => {
        return modules
            .map(module => ({
                ...module,
                tasks: pendingTasks.filter(task => task.module === module.name)
            }))
            .filter(module => module.tasks.length > 0)
    }, [modules, pendingTasks])

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
    const handleModuleSelectAll = (moduleTasks, checked) => {
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
    const isModuleAllSelected = (moduleTasks) => {
        return moduleTasks.length > 0 && moduleTasks.every(task => selectedTaskIds.has(task.id))
    }

    // 检查模块是否部分选中
    const isModuleIndeterminate = (moduleTasks) => {
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
    const getModuleSelectedCount = (moduleTasks) => {
        return moduleTasks.filter(task => selectedTaskIds.has(task.id)).length
    }

    // 格式化配置
    const formatConfig = {
        excel: {
            icon: FileExcelOutlined,
            color: '#52c41a',
            label: 'Excel 表格',
            description: '适合数据分析和打印'
        },
        markdown: {
            icon: FileMarkdownOutlined,
            color: '#1890ff',
            label: 'Markdown 文档',
            description: '适合文档编辑和分享'
        }
    }

    const currentFormat = formatConfig[exportFormat]

    return (
        <Modal
            title={
                <div className={styles.modalHeader}>
                    <currentFormat.icon className={styles.modalIcon} style={{ color: currentFormat.color }} />
                    <div className={styles.modalTitleContent}>
                        <div className={styles.modalTitle}>导出未完成任务</div>
                        <div className={styles.modalSubtitle}>{currentFormat.description}</div>
                    </div>
                </div>
            }
            open={show}
            onCancel={onCancel}
            footer={
                <div className={styles.modalFooter}>
                    <div className={styles.footerInfo}>
                        <CheckCircleOutlined className={styles.footerIcon} />
                        <span>已选择 <strong>{selectedTaskIds.size}</strong> / {pendingTasks.length} 个任务</span>
                    </div>
                    <div className={styles.footerButtons}>
                        <Button onClick={onCancel} className={styles.btnCancel}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleConfirm}
                            disabled={selectedTaskIds.size === 0}
                            className={styles.btnExport}
                            style={{
                                background: selectedTaskIds.size > 0 ? currentFormat.color : undefined,
                                borderColor: selectedTaskIds.size > 0 ? currentFormat.color : undefined
                            }}
                            icon={<currentFormat.icon />}
                        >
                            导出 {currentFormat.label}
                        </Button>
                    </div>
                </div>
            }
            width={600}
            className={styles.exportModal}
            destroyOnHidden
        >
            {modulesWithTasks.length === 0 ? (
                <Empty 
                    description="暂无未完成任务" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    className={styles.emptyState}
                />
            ) : (
                <div className={styles.modalContent}>
                    {/* 导出格式选择 */}
                    <div className={styles.formatSection}>
                        <div className={styles.sectionLabel}>
                            <FileTextOutlined />
                            <span>选择导出格式</span>
                        </div>
                        <Radio.Group 
                            value={exportFormat} 
                            onChange={(e) => setExportFormat(e.target.value)}
                            className={styles.formatRadioGroup}
                        >
                            <Radio.Button value="excel" className={styles.formatOption}>
                                <FileExcelOutlined style={{ color: '#52c41a' }} />
                                <div className={styles.formatInfo}>
                                    <div className={styles.formatLabel}>Excel 表格</div>
                                    <div className={styles.formatDesc}>数据分析和打印</div>
                                </div>
                            </Radio.Button>
                            <Radio.Button value="markdown" className={styles.formatOption}>
                                <FileMarkdownOutlined style={{ color: '#1890ff' }} />
                                <div className={styles.formatInfo}>
                                    <div className={styles.formatLabel}>Markdown 文档</div>
                                    <div className={styles.formatDesc}>文档编辑和分享</div>
                                </div>
                            </Radio.Button>
                        </Radio.Group>
                    </div>

                    {/* 全选控制 */}
                    <div className={styles.selectAllSection}>
                        <Checkbox
                            checked={isAllSelected}
                            indeterminate={isIndeterminate}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className={styles.selectAllCheckbox}
                        >
                            <span className={styles.selectAllLabel}>全选所有任务</span>
                        </Checkbox>
                        <Badge 
                            count={selectedTaskIds.size} 
                            showZero 
                            style={{ 
                                backgroundColor: currentFormat.color,
                                boxShadow: `0 0 0 1px ${currentFormat.color}20`
                            }}
                        />
                    </div>

                    {/* 模块和任务选择 */}
                    <div className={styles.taskListContainer}>
                        <Collapse
                            ghost
                            expandIcon={({ isActive }) => (
                                <CaretRightOutlined 
                                    rotate={isActive ? 90 : 0} 
                                    className={styles.expandIcon}
                                />
                            )}
                            defaultActiveKey={modulesWithTasks.map(m => m.id)}
                            className={styles.moduleCollapse}
                            items={modulesWithTasks.map(module => {
                                const selectedCount = getModuleSelectedCount(module.tasks)
                                const isAllSelected = isModuleAllSelected(module.tasks)
                                const isIndeterminate = isModuleIndeterminate(module.tasks)
                                
                                return {
                                    key: module.id,
                                    label: (
                                        <div
                                            className={styles.moduleHeader}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={isAllSelected}
                                                indeterminate={isIndeterminate}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    handleModuleSelectAll(module.tasks, e.target.checked)
                                                }}
                                                className={styles.moduleCheckbox}
                                            />
                                            <FolderOutlined className={styles.moduleIcon} />
                                            <span className={styles.moduleName}>{module.name}</span>
                                            <Badge 
                                                count={`${selectedCount}/${module.tasks.length}`}
                                                className={styles.moduleBadge}
                                                style={{
                                                    backgroundColor: isAllSelected ? currentFormat.color : '#faad14'
                                                }}
                                            />
                                        </div>
                                    ),
                                    children: (
                                        <div className={styles.taskList}>
                                            {module.tasks.map(task => (
                                                <div 
                                                    key={task.id} 
                                                    className={`${styles.taskItem} ${selectedTaskIds.has(task.id) ? styles.taskItemSelected : ''}`}
                                                >
                                                    <Checkbox
                                                        checked={selectedTaskIds.has(task.id)}
                                                        onChange={(e) => handleTaskChange(task.id, e.target.checked)}
                                                        className={styles.taskCheckbox}
                                                    >
                                                        <span className={styles.taskName}>
                                                            {task.name}
                                                        </span>
                                                    </Checkbox>
                                                </div>
                                            ))}
                                        </div>
                                    ),
                                    className: styles.modulePanel
                                }
                            })}
                        />
                    </div>
                </div>
            )}
        </Modal>
    )
}
