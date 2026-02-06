/**
 * 任务管理视图组件
 *
 * 功能说明:
 * - 项目的核心工作界面,用于管理项目下的所有任务
 * - 左右分栏展示待办任务和已完成任务
 * - 提供任务的添加、编辑、完成、回滚、删除等操作
 * - 支持任务搜索和按模块分组展示
 * - 显示今日统计数据(新增、完成、待办、总数)
 * - 支持导出今日日报功能
 * - 集成项目备忘查看和编辑功能
 * - 包含图片预览和删除确认等辅助功能
 * - 使用 Ant Design 布局组件实现响应式设计
 *
 * 使用场景:
 * - 选择项目后进入的任务管理界面
 * - 日常任务的增删改查操作
 */
import React from 'react'
import { Button, Input, Card, Row, Col, Empty, Tooltip, Select, Dropdown } from 'antd'
import {
    PlusOutlined,
    FileExcelOutlined,
    CheckCircleOutlined,
    FileTextOutlined,
    TrophyOutlined,
    LeftOutlined,
    SearchOutlined,
    CloseCircleOutlined,
    EditOutlined,
    DownOutlined,
    UpOutlined,
    CalendarOutlined,
    BarChartOutlined,
    PauseCircleOutlined
} from '@ant-design/icons'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import WindowControls from '../common/WindowControls'
import ModuleGroup from './ModuleGroup'
import TaskCard from './TaskCard'
import TaskModal from './TaskModal'
import ImagePreview from '../common/ImagePreview'
import DeleteTaskModal from './DeleteTaskModal'
import ProjectMemo from '../project/ProjectMemo'
import EditTaskModuleModal from './EditTaskModuleModal'
import EditModuleListModal from './EditModuleListModal'
import ExportPendingTasksModal from './ExportPendingTasksModal'
import StatsModal from './StatsModal'
import ShelvedTasksModal from './ShelvedTasksModal'
import styles from './TaskManageView.module.css'

export default function TaskManageView({
    currentProject,
    todayStats,
    tasks = [],
    pendingTasks,
    completedTasks,
    searchKeyword,
    selectedModuleFilter,
    completedSearchKeyword,
    completedModuleFilter,
    collapsedModules,
    editingModuleName,
    showAddTaskModal,
    showEditTaskModal,
    showDeleteConfirm,
    showProjectMemo,
    projectMemoMode,
    showEditTaskModuleModal,
    showEditModuleListModal,
    newTask,
    editingTask,
    taskToDelete,
    editingProjectMemo,
    editingTaskModule,
    modules,
    recycleModules = [],
    taskTypes = [],
    taskTypeColors = {},
    showModuleDropdown,
    showEditModuleDropdown,
    showTypeDropdown,
    showEditTypeDropdown,
    dragActive,
    imagePreview,
    taskRefs,
    editTaskRefs,
    onBack,
    onExportReport,
    onExportPendingTasks,
    showExportPendingModal,
    onOpenExportPendingModal,
    onCloseExportPendingModal,
    showStatsModal,
    onOpenStats,
    onCloseStats,
    onConfigChange,
    onSearchChange,
    onModuleFilterChange,
    onCompletedSearchChange,
    onCompletedModuleFilterChange,
    onToggleModuleCollapse,
    onStartEditModuleName,
    onEditModuleNameChange,
    onSaveModuleName,
    onCancelEditModuleName,
    onTaskComplete,
    onTaskRollback,
    onTaskEdit,
    onTaskDelete,
    onImageClick,
    onOpenAddTaskModal,
    onCloseAddTaskModal,
    onNewTaskChange,
    onModuleDropdownToggle,
    onTypeDropdownToggle,
    onModuleSelect,
    onTypeSelect,
    onImageChange,
    onRemoveImage,
    onDrag,
    onDrop,
    onPaste,
    onConfirmAddTask,
    onEditTaskChange,
    onEditModuleDropdownToggle,
    onEditTypeDropdownToggle,
    onEditModuleSelect,
    onEditTypeSelect,
    onEditImageChange,
    onRemoveEditImage,
    onRemoveExistingImage,
    onEditDrag,
    onEditDrop,
    onEditPaste,
    onConfirmUpdateTask,
    onCloseEditTaskModal,
    onConfirmDelete,
    onCancelDelete,
    onOpenProjectMemoView,
    onSwitchToEditMode,
    onCloseProjectMemo,
    onProjectMemoChange,
    onUpdateProjectMemo,
    onCloseImagePreview,
    onPrevImage,
    onNextImage,
    groupTasksByModule,
    onQuickAddTask,
    onOpenEditTaskModule,
    onConfirmEditTaskModule,
    onCloseEditTaskModule,
    onOpenEditModuleList,
    onUpdateModuleInList,
    onDeleteModuleInList,
    onPermanentDeleteModuleInList,
    onRestoreModuleInList,
    onAddModuleInList,
    onReorderModules,
    onCloseEditModuleList,
    shelvedTasks = [],
    showShelvedTasks,
    onToggleShelvedTasks,
    onTaskShelve,
    onTaskUnshelve,
    onReorderPendingModules,
    onCheckItemChange
}) {
    const pendingTasksByModule = groupTasksByModule(pendingTasks)
    const completedTasksByModule = groupTasksByModule(completedTasks)

    // 配置拖拽传感器
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // 检查待办任务是否全部收起
    const allPendingCollapsed = pendingTasksByModule.length > 0 && pendingTasksByModule.every(group => {
        const moduleKey = `${group.moduleName}-pending`
        return collapsedModules[moduleKey]
    })

    // 处理待办模块拖拽排序
    const handlePendingModuleDragEnd = (event) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            const oldIndex = pendingTasksByModule.findIndex(g => g.moduleName === active.id)
            const newIndex = pendingTasksByModule.findIndex(g => g.moduleName === over.id)
            if (oldIndex !== -1 && newIndex !== -1 && onReorderPendingModules) {
                onReorderPendingModules(oldIndex, newIndex)
            }
        }
    }

    // 将数组转换为对象格式（用于某些功能）
    const pendingTasksByModuleObj = {}
    pendingTasksByModule.forEach(group => {
        pendingTasksByModuleObj[group.moduleName] = group.tasks
    })

    // 生成搜索提示文字
    const getSearchPlaceholder = () => {
        return '搜索任务...'
    }

    // 生成任务列表的 Tooltip 内容
    const generateTaskTooltip = (taskList) => {
        if (!taskList || taskList.length === 0) {
            return <div style={{ padding: '4px 0' }}>暂无任务</div>
        }

        // 按模块分组
        const tasksByModule = groupTasksByModule(taskList)

        return (
            <div style={{
                maxHeight: 400,
                overflowY: 'auto',
                padding: '4px 0',
                paddingRight: 8,
                // 自定义滚动条样式
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent'
            }}
                className="custom-tooltip-scrollbar"
            >
                <style>{`
          .custom-tooltip-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-tooltip-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 3px;
          }
          .custom-tooltip-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 3px;
            transition: background 0.2s;
          }
          .custom-tooltip-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.5);
          }
        `}</style>
                {tasksByModule.map(group => (
                    <div key={group.moduleName} style={{ marginBottom: 12 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6, color: '#fff' }}>
                            {group.moduleName}
                        </div>
                        {group.tasks.map((task) => (
                            <div key={task.id} style={{
                                marginLeft: 12,
                                marginBottom: 4,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}>
                                {task.type && (
                                    <span style={{
                                        fontSize: 11,
                                        padding: '2px 6px',
                                        borderRadius: 3,
                                        background: taskTypeColors[task.type] || '#d9d9d9',
                                        color: '#fff',
                                        flexShrink: 0,
                                        fontWeight: 500
                                    }}>
                                        {task.type}
                                    </span>
                                )}
                                <span style={{ color: 'rgba(255,255,255,0.85)' }}>{task.name}</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        )
    }

    // 获取今日新增任务列表
    const getTodayNewTasks = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return tasks.filter(task => {
            const createdDate = new Date(task.createdAt)
            createdDate.setHours(0, 0, 0, 0)
            return createdDate.getTime() === today.getTime()
        })
    }

    // 获取今日完成任务列表
    const getTodayCompletedTasks = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false
            const completedDate = new Date(task.completedAt)
            completedDate.setHours(0, 0, 0, 0)
            return completedDate.getTime() === today.getTime()
        })
    }

    // 检查待办任务是否全部展开
    const allPendingExpanded = pendingTasksByModule.every(group => {
        const moduleKey = `${group.moduleName}-pending`
        return !collapsedModules[moduleKey]
    })

    // 一键展开/收起待办任务
    const handleToggleAllPending = () => {
        // 如果全部展开，则设置为 true（收起）；如果有收起的，则设置为 false（展开）
        const targetState = allPendingExpanded

        pendingTasksByModule.forEach(group => {
            onToggleModuleCollapse(group.moduleName, 'pending', targetState)
        })
    }

    // 检查已完成任务是否全部展开
    const allCompletedExpanded = completedTasksByModule.every(group => {
        const moduleKey = `${group.moduleName}-completed`
        return !collapsedModules[moduleKey]
    })

    // 一键展开/收起已完成任务
    const handleToggleAllCompleted = () => {
        const targetState = allCompletedExpanded

        completedTasksByModule.forEach(group => {
            onToggleModuleCollapse(group.moduleName, 'completed', targetState)
        })
    }

    // 监听快捷键 Ctrl + N
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'n') {
                e.preventDefault()
                if (!showAddTaskModal) {
                    onOpenAddTaskModal()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onOpenAddTaskModal, showAddTaskModal])

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#f8fafc'
        }}>

            <WindowControls title={`任务日志 - ${currentProject?.name}`} onConfigChange={onConfigChange} />

            {/* 头部区域 */}
            <header style={{
                background: '#ffffff',
                padding: '16px 32px',
                paddingTop: '52px',
                borderBottom: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={onBack}
                        style={{
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            color: '#475569',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e2e8f0'
                            e.currentTarget.style.borderColor = '#cbd5e1'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f1f5f9'
                            e.currentTarget.style.borderColor = '#e2e8f0'
                        }}
                    >
                        返回
                    </Button>
                    <h1 style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: 0,
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <FileTextOutlined style={{ fontSize: 28, color: '#3b82f6' }} />
                        {currentProject?.name}
                    </h1>
                    {currentProject?.memo ? (
                        <div
                            onClick={onOpenProjectMemoView}
                            style={{
                                cursor: 'pointer',
                                background: '#eff6ff',
                                padding: '10px 16px',
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                maxWidth: 300,
                                border: '1px solid #dbeafe',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#dbeafe'
                                e.currentTarget.style.borderColor = '#bfdbfe'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#eff6ff'
                                e.currentTarget.style.borderColor = '#dbeafe'
                            }}
                        >
                            <FileTextOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
                            <span style={{
                                color: '#1e40af',
                                fontSize: 13,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontWeight: 500
                            }}>
                                {currentProject.memo}
                            </span>
                        </div>
                    ) : (
                        <Button
                            icon={<EditOutlined />}
                            onClick={onOpenProjectMemoView}
                            style={{
                                background: '#eff6ff',
                                border: '1px solid #dbeafe',
                                color: '#1e40af',
                                fontWeight: 500
                            }}
                        >
                            添加备忘
                        </Button>
                    )}
                </div>
            </header>

            {/* 主内容区域 */}
            <main style={{
                flex: 1,
                padding: '24px 32px',
                overflowY: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* 操作栏和统计 */}
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Tooltip
                        title="Ctrl + N"
                        styles={{ body: { padding: '4px 8px', fontSize: '12px' } }}
                    >
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={onOpenAddTaskModal}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                borderColor: '#3b82f6',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
                                height: 40
                            }}
                        >
                            添加新任务
                        </Button>
                    </Tooltip>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'today',
                                    icon: <CalendarOutlined />,
                                    label: '导出今日日报',
                                    onClick: onExportReport
                                },
                                {
                                    key: 'pending',
                                    icon: <FileExcelOutlined />,
                                    label: '导出未完成任务',
                                    onClick: onOpenExportPendingModal
                                }
                            ]
                        }}
                        trigger={['click']}
                    >
                        <Button
                            type="primary"
                            size="large"
                            icon={<FileExcelOutlined />}
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                borderColor: '#10b981',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                                height: 40
                            }}
                        >
                            导出 <DownOutlined />
                        </Button>
                    </Dropdown>
                    <Button
                        type="default"
                        size="large"
                        icon={<EditOutlined />}
                        onClick={onOpenEditModuleList}
                        style={{
                            background: '#ffffff',
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            fontWeight: 500,
                            height: 40
                        }}
                    >
                        编辑模块
                    </Button>
                    <Button
                        type="default"
                        size="large"
                        icon={<BarChartOutlined />}
                        onClick={onOpenStats}
                        style={{
                            background: '#ffffff',
                            borderColor: '#e2e8f0',
                            color: '#475569',
                            fontWeight: 500,
                            height: 40
                        }}
                    >
                        统计报表
                    </Button>

                    <div style={{ flex: 1, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <Tooltip
                            title={generateTaskTooltip(getTodayNewTasks())}
                            placement="bottom"
                            styles={{ root: { maxWidth: 400 } }}
                        >
                            <Card size="small"
                                style={{
                                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                    minWidth: 120,
                                    cursor: 'pointer',
                                    border: '1px solid #bfdbfe',
                                    borderRadius: 12,
                                    boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(59, 130, 246, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
                                    }}>
                                        <PlusOutlined style={{ fontSize: 18, color: '#ffffff' }} />
                                    </div>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>今日新增</div>
                                        <div style={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: '#1e40af'
                                        }}>{todayStats.newCount || 0}</div>
                                    </div>
                                </div>
                            </Card>
                        </Tooltip>
                        <Tooltip
                            title={generateTaskTooltip(getTodayCompletedTasks())}
                            placement="bottom"
                            styles={{ root: { maxWidth: 400 } }}
                        >
                            <Card size="small"
                                style={{
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    minWidth: 120,
                                    cursor: 'pointer',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: 12,
                                    boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(16, 185, 129, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                                    }}>
                                        <CheckCircleOutlined style={{ fontSize: 18, color: '#ffffff' }} />
                                    </div>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>今日完成</div>
                                        <div style={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: '#047857'
                                        }}>{todayStats.count}</div>
                                    </div>
                                </div>
                            </Card>
                        </Tooltip>
                        <Tooltip
                            title={generateTaskTooltip(pendingTasks)}
                            placement="bottom"
                            styles={{ root: { maxWidth: 400 } }}
                        >
                            <Card size="small"
                                style={{
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    minWidth: 120,
                                    cursor: 'pointer',
                                    border: '1px solid #fcd34d',
                                    borderRadius: 12,
                                    boxShadow: '0 1px 3px rgba(245, 158, 11, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(245, 158, 11, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
                                    }}>
                                        <FileTextOutlined style={{ fontSize: 18, color: '#ffffff' }} />
                                    </div>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>待办任务</div>
                                        <div style={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: '#b45309'
                                        }}>{pendingTasks.length}</div>
                                    </div>
                                </div>
                            </Card>
                        </Tooltip>
                        <Tooltip
                            title={generateTaskTooltip([...pendingTasks, ...completedTasks])}
                            placement="bottom"
                            styles={{ root: { maxWidth: 400 } }}
                        >
                            <Card size="small"
                                style={{
                                    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                                    minWidth: 120,
                                    cursor: 'pointer',
                                    border: '1px solid #d8b4fe',
                                    borderRadius: 12,
                                    boxShadow: '0 1px 3px rgba(168, 85, 247, 0.1)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)'
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.15)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)'
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(168, 85, 247, 0.1)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 2px 8px rgba(168, 85, 247, 0.25)'
                                    }}>
                                        <TrophyOutlined style={{ fontSize: 18, color: '#ffffff' }} />
                                    </div>
                                    <div>
                                        <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>总任务数</div>
                                        <div style={{
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: '#7e22ce'
                                        }}>{pendingTasks.length + completedTasks.length}</div>
                                    </div>
                                </div>
                            </Card>
                        </Tooltip>
                        {shelvedTasks.length > 0 && (
                            <Tooltip
                                title={generateTaskTooltip(shelvedTasks)}
                                placement="bottom"
                                styles={{ root: { maxWidth: 400 } }}
                            >
                                <Card size="small"
                                    onClick={onToggleShelvedTasks}
                                    style={{
                                        background: showShelvedTasks
                                            ? 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)'
                                            : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                                        minWidth: 120,
                                        cursor: 'pointer',
                                        border: showShelvedTasks ? '2px solid #fb923c' : '1px solid #fed7aa',
                                        borderRadius: 12,
                                        boxShadow: showShelvedTasks
                                            ? '0 4px 12px rgba(251, 146, 60, 0.2)'
                                            : '0 1px 3px rgba(251, 146, 60, 0.1)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!showShelvedTasks) {
                                            e.currentTarget.style.transform = 'translateY(-2px)'
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 146, 60, 0.15)'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!showShelvedTasks) {
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(251, 146, 60, 0.1)'
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 10,
                                            background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(251, 146, 60, 0.25)'
                                        }}>
                                            <PauseCircleOutlined style={{ fontSize: 18, color: '#ffffff' }} />
                                        </div>
                                        <div>
                                            <div style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>搁置任务</div>
                                            <div style={{
                                                fontSize: 20,
                                                fontWeight: 700,
                                                color: '#c2410c'
                                            }}>{shelvedTasks.length}</div>
                                        </div>
                                    </div>
                                </Card>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* 任务列表 - 重构版 */}
                <div style={{ 
                    flex: 1, 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: 24,
                    overflow: 'hidden'
                }}>
                    {/* 待办任务区域 */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)',
                        border: '2px solid #fcd34d',
                        overflow: 'hidden'
                    }}>
                        {/* 待办任务头部 */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 16,
                            marginBottom: 20
                        }}>
                            {/* 标题行 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                                    }}>
                                        <FileTextOutlined style={{ fontSize: 24, color: '#ffffff' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ 
                                            margin: 0, 
                                            fontSize: 18, 
                                            fontWeight: 700, 
                                            color: '#78350f',
                                            lineHeight: 1.2
                                        }}>
                                            待办任务
                                        </h3>
                                        <p style={{ 
                                            margin: 0, 
                                            fontSize: 13, 
                                            color: '#92400e',
                                            fontWeight: 500
                                        }}>
                                            {pendingTasks.length} 个任务待处理
                                        </p>
                                    </div>
                                </div>
                                {pendingTasksByModule.length > 0 && (
                                    <div
                                        onClick={handleToggleAllPending}
                                        style={{
                                            cursor: 'pointer',
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            border: '1px solid rgba(245, 158, 11, 0.4)',
                                            borderRadius: 10,
                                            padding: '8px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)'
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(245, 158, 11, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                                            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(245, 158, 11, 0.1)'
                                        }}
                                    >
                                        {allPendingExpanded ? <UpOutlined style={{ fontSize: 12, color: '#92400e' }} /> : <DownOutlined style={{ fontSize: 12, color: '#92400e' }} />}
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                                            {allPendingExpanded ? '全部收起' : '全部展开'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 搜索和筛选行 */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Select
                                    style={{ width: 140 }}
                                    placeholder="筛选模块"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={selectedModuleFilter}
                                    onChange={onModuleFilterChange}
                                    options={modules.map(m => ({ label: m.name, value: m.name }))}
                                    size="middle"
                                />
                                <Input
                                    placeholder={getSearchPlaceholder()}
                                    value={searchKeyword}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    prefix={<SearchOutlined style={{ fontSize: 14, color: '#92400e' }} />}
                                    suffix={searchKeyword && (
                                        <CloseCircleOutlined 
                                            onClick={() => onSearchChange('')} 
                                            style={{
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                color: '#92400e'
                                            }} 
                                        />
                                    )}
                                    style={{ flex: 1 }}
                                    size="middle"
                                />
                            </div>
                        </div>

                        {/* 待办任务列表 */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            background: 'rgba(255, 255, 255, 0.5)',
                            borderRadius: 12,
                            padding: 16,
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                        }}
                        className={styles.taskCardBody}
                        >
                            {pendingTasks.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',
                                    minHeight: 200
                                }}>
                                    <Empty
                                        image={searchKeyword ? <SearchOutlined style={{ fontSize: 60, color: '#d9d9d9' }} /> : Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span style={{ color: '#92400e' }}>
                                                {searchKeyword ? `未找到包含"${searchKeyword}"的任务` : '暂无待办任务'}
                                            </span>
                                        }
                                    />
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handlePendingModuleDragEnd}
                                >
                                    <SortableContext
                                        items={pendingTasksByModule.map(g => g.moduleName)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {pendingTasksByModule.map(group => {
                                            const moduleKey = `${group.moduleName}-pending`
                                            const isCollapsed = collapsedModules[moduleKey]
                                            const isEditing = editingModuleName?.moduleName === group.moduleName && editingModuleName?.status === 'pending'
                                            return (
                                                <ModuleGroup
                                                    key={group.moduleName}
                                                    moduleName={group.moduleName}
                                                    tasks={group.tasks}
                                                    status="pending"
                                                    isCollapsed={isCollapsed}
                                                    isEditing={isEditing}
                                                    editingName={editingModuleName?.newName || ''}
                                                    taskTypeColors={taskTypeColors}
                                                    onToggleCollapse={() => onToggleModuleCollapse(group.moduleName, 'pending')}
                                                    onStartEdit={() => onStartEditModuleName(group.moduleName, 'pending')}
                                                    onEditNameChange={onEditModuleNameChange}
                                                    onSaveEdit={onSaveModuleName}
                                                    onCancelEdit={onCancelEditModuleName}
                                                    onTaskComplete={onTaskComplete}
                                                    onTaskRollback={onTaskRollback}
                                                    onTaskEdit={onTaskEdit}
                                                    onTaskDelete={onTaskDelete}
                                                    onImageClick={onImageClick}
                                                    onQuickAddTask={onQuickAddTask}
                                                    onEditTaskModule={onOpenEditTaskModule}
                                                    onTaskShelve={onTaskShelve}
                                                    onCheckItemChange={onCheckItemChange}
                                                    sortableId={group.moduleName}
                                                    isDraggable={allPendingCollapsed}
                                                />
                                            )
                                        })}
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>

                    {/* 已完成任务区域 */}
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        borderRadius: 16,
                        padding: 20,
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
                        border: '2px solid #6ee7b7',
                        overflow: 'hidden'
                    }}>
                        {/* 已完成任务头部 */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 16,
                            marginBottom: 20
                        }}>
                            {/* 标题行 */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: 12,
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}>
                                        <CheckCircleOutlined style={{ fontSize: 24, color: '#ffffff' }} />
                                    </div>
                                    <div>
                                        <h3 style={{ 
                                            margin: 0, 
                                            fontSize: 18, 
                                            fontWeight: 700, 
                                            color: '#064e3b',
                                            lineHeight: 1.2
                                        }}>
                                            已完成
                                        </h3>
                                        <p style={{ 
                                            margin: 0, 
                                            fontSize: 13, 
                                            color: '#065f46',
                                            fontWeight: 500
                                        }}>
                                            {completedTasks.length} 个任务已完成
                                        </p>
                                    </div>
                                </div>
                                {completedTasksByModule.length > 0 && (
                                    <div
                                        onClick={handleToggleAllCompleted}
                                        style={{
                                            cursor: 'pointer',
                                            background: 'rgba(255, 255, 255, 0.8)',
                                            border: '1px solid rgba(16, 185, 129, 0.4)',
                                            borderRadius: 10,
                                            padding: '8px 14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)'
                                            e.currentTarget.style.transform = 'translateY(-1px)'
                                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.15)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                                            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.1)'
                                        }}
                                    >
                                        {allCompletedExpanded ? <UpOutlined style={{ fontSize: 12, color: '#065f46' }} /> : <DownOutlined style={{ fontSize: 12, color: '#065f46' }} />}
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#065f46' }}>
                                            {allCompletedExpanded ? '全部收起' : '全部展开'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 搜索和筛选行 */}
                            <div style={{ display: 'flex', gap: 8 }}>
                                <Select
                                    style={{ width: 140 }}
                                    placeholder="筛选模块"
                                    allowClear
                                    showSearch
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={completedModuleFilter}
                                    onChange={onCompletedModuleFilterChange}
                                    options={modules.map(m => ({ label: m.name, value: m.name }))}
                                    size="middle"
                                />
                                <Input
                                    placeholder={getSearchPlaceholder()}
                                    value={completedSearchKeyword}
                                    onChange={(e) => onCompletedSearchChange(e.target.value)}
                                    prefix={<SearchOutlined style={{ fontSize: 14, color: '#065f46' }} />}
                                    suffix={completedSearchKeyword && (
                                        <CloseCircleOutlined 
                                            onClick={() => onCompletedSearchChange('')}
                                            style={{
                                                cursor: 'pointer',
                                                fontSize: 14,
                                                color: '#065f46'
                                            }} 
                                        />
                                    )}
                                    style={{ flex: 1 }}
                                    size="middle"
                                />
                            </div>
                        </div>

                        {/* 已完成任务列表 */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            background: 'rgba(255, 255, 255, 0.5)',
                            borderRadius: 12,
                            padding: 16,
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}
                        className={styles.taskCardBody}
                        >
                            {completedTasks.length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%',
                                    minHeight: 200
                                }}>
                                    <Empty
                                        image={completedSearchKeyword ? <SearchOutlined style={{ fontSize: 60, color: '#d9d9d9' }} /> : Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={
                                            <span style={{ color: '#065f46' }}>
                                                {completedSearchKeyword ? `未找到包含"${completedSearchKeyword}"的任务` : '还没有完成的任务'}
                                            </span>
                                        }
                                    />
                                </div>
                            ) : (
                                completedTasksByModule.map(group => {
                                    const moduleKey = `${group.moduleName}-completed`
                                    const isCollapsed = collapsedModules[moduleKey]
                                    return (
                                        <ModuleGroup
                                            key={group.moduleName}
                                            moduleName={group.moduleName}
                                            tasks={group.tasks}
                                            status="completed"
                                            isCollapsed={isCollapsed}
                                            isEditing={false}
                                            editingName=""
                                            taskTypeColors={taskTypeColors}
                                            onToggleCollapse={() => onToggleModuleCollapse(group.moduleName, 'completed')}
                                            onStartEdit={() => {}}
                                            onEditNameChange={() => {}}
                                            onSaveEdit={() => {}}
                                            onCancelEdit={() => {}}
                                            onTaskComplete={onTaskComplete}
                                            onTaskRollback={onTaskRollback}
                                            onTaskEdit={onTaskEdit}
                                            onTaskDelete={onTaskDelete}
                                            onImageClick={onImageClick}
                                        />
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* 添加任务模态框 */}
            <TaskModal
                show={showAddTaskModal}
                isEdit={false}
                task={newTask}
                modules={modules}
                recycleModules={recycleModules}
                taskTypes={taskTypes}
                showModuleDropdown={showModuleDropdown}
                showTypeDropdown={showTypeDropdown}
                dragActive={dragActive}
                onTaskChange={onNewTaskChange}
                onModuleDropdownToggle={onModuleDropdownToggle}
                onTypeDropdownToggle={onTypeDropdownToggle}
                onModuleSelect={onModuleSelect}
                onTypeSelect={onTypeSelect}
                onImageChange={onImageChange}
                onRemoveImage={onRemoveImage}
                onRemoveExistingImage={() => {
                }}
                onDrag={onDrag}
                onDrop={onDrop}
                onPaste={onPaste}
                onConfirm={onConfirmAddTask}
                onCancel={onCloseAddTaskModal}
                onPreviewImage={onImageClick}
                refs={taskRefs}
            />

            {/* 编辑任务模态框 */}
            <TaskModal
                show={showEditTaskModal}
                isEdit={true}
                task={editingTask || {}}
                modules={modules}
                recycleModules={recycleModules}
                taskTypes={taskTypes}
                showModuleDropdown={showEditModuleDropdown}
                showTypeDropdown={showEditTypeDropdown}
                dragActive={dragActive}
                onTaskChange={onEditTaskChange}
                onModuleDropdownToggle={onEditModuleDropdownToggle}
                onTypeDropdownToggle={onEditTypeDropdownToggle}
                onModuleSelect={onEditModuleSelect}
                onTypeSelect={onEditTypeSelect}
                onImageChange={onEditImageChange}
                onRemoveImage={onRemoveEditImage}
                onRemoveExistingImage={onRemoveExistingImage}
                onDrag={onEditDrag}
                onDrop={onEditDrop}
                onPaste={onEditPaste}
                onConfirm={onConfirmUpdateTask}
                onCancel={onCloseEditTaskModal}
                onPreviewImage={onImageClick}
                refs={editTaskRefs}
            />

            {/* 删除确认模态框 */}
            <DeleteTaskModal
                show={showDeleteConfirm}
                task={taskToDelete}
                taskTypeColor={taskToDelete?.type ? taskTypeColors[taskToDelete.type] : null}
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />

            {/* 图片预览模态框 */}
            <ImagePreview
                imagePreview={imagePreview}
                onClose={onCloseImagePreview}
                onPrev={onPrevImage}
                onNext={onNextImage}
                onDelete={imagePreview.onDelete}
            />

            {/* 项目备忘便签查看 */}
            {/* 项目备忘组件（查看/编辑合一） */}
            <ProjectMemo
                show={showProjectMemo}
                mode={projectMemoMode}
                memo={editingProjectMemo?.memo || ''}
                projectName={editingProjectMemo?.name || ''}
                onMemoChange={onProjectMemoChange}
                onConfirm={onUpdateProjectMemo}
                onCancel={onCloseProjectMemo}
                onEdit={onSwitchToEditMode}
            />

            {/* 编辑任务模块模态框 */}
            <EditTaskModuleModal
                show={showEditTaskModuleModal}
                task={editingTaskModule}
                modules={modules}
                onConfirm={onConfirmEditTaskModule}
                onCancel={onCloseEditTaskModule}
            />

            {/* 编辑模块列表模态框 */}
            <EditModuleListModal
                show={showEditModuleListModal}
                modules={modules}
                recycleModules={recycleModules}
                tasks={tasks}
                onUpdateModule={onUpdateModuleInList}
                onDeleteModule={onDeleteModuleInList}
                onPermanentDeleteModule={onPermanentDeleteModuleInList}
                onRestoreModule={onRestoreModuleInList}
                onAddModule={onAddModuleInList}
                onReorderModules={onReorderModules}
                onClose={onCloseEditModuleList}
            />

            {/* 导出未完成任务模态框 */}
            <ExportPendingTasksModal
                show={showExportPendingModal}
                modules={modules}
                pendingTasks={pendingTasks}
                onConfirm={onExportPendingTasks}
                onCancel={onCloseExportPendingModal}
            />

            {/* 统计报表模态框 */}
            <StatsModal
                show={showStatsModal}
                modules={modules}
                tasks={tasks}
                taskTypeColors={taskTypeColors}
                onClose={onCloseStats}
            />

            {/* 搁置任务模态框 */}
            <ShelvedTasksModal
                show={showShelvedTasks}
                shelvedTasks={shelvedTasks}
                taskTypeColors={taskTypeColors}
                onTaskComplete={onTaskComplete}
                onTaskRollback={onTaskRollback}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
                onImageClick={onImageClick}
                onTaskUnshelve={onTaskUnshelve}
                onCheckItemChange={onCheckItemChange}
                onClose={onToggleShelvedTasks}
            />
        </div>
    )
}
