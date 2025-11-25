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
import { Button, Input, Card, Row, Col, Empty, Space, Tooltip, Select } from 'antd'
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
  UpOutlined
} from '@ant-design/icons'
import WindowControls from '../common/WindowControls'
import ModuleGroup from './ModuleGroup'
import TaskModal from './TaskModal'
import ImagePreview from '../common/ImagePreview'
import ConfirmModal from '../common/ConfirmModal'
import ProjectMemoView from '../project/ProjectMemoView'
import ProjectMemoModal from '../project/ProjectMemoModal'
import EditTaskModuleModal from './EditTaskModuleModal'
import EditModuleListModal from './EditModuleListModal'
import styles from './TaskManageView.module.css'
export default function TaskManageView({
  currentProject,
  todayStats,
  tasks = [],
  pendingTasks,
  completedTasks,
  searchKeyword,
  searchScope = 'all',
  selectedModuleFilter,
  collapsedModules,
  editingModuleName,
  showAddTaskModal,
  showEditTaskModal,
  showDeleteConfirm,
  showProjectMemoView,
  showProjectMemoModal,
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
  onAddTask,
  onExportReport,
  onConfigChange,
  onSearchChange,
  onModuleFilterChange,
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
  onOpenProjectMemoEdit,
  onCloseProjectMemoView,
  onProjectMemoChange,
  onUpdateProjectMemo,
  onCloseProjectMemoModal,
  onOpenAddProjectMemo,
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
  onRestoreModuleInList,
  onReorderModules,
  onCloseEditModuleList
}) {
  const pendingTasksByModule = groupTasksByModule(pendingTasks)
  const completedTasksByModule = groupTasksByModule(completedTasks)
  
  // 将数组转换为对象格式（用于某些功能）
  const pendingTasksByModuleObj = {}
  pendingTasksByModule.forEach(group => {
    pendingTasksByModuleObj[group.moduleName] = group.tasks
  })

  // 根据搜索范围生成提示文字
  const getSearchPlaceholder = () => {
    switch (searchScope) {
      case 'module':
        return '搜索模块名称...'
      case 'description':
        return '搜索任务描述...'
      case 'all':
      default:
        return '搜索任务...'
    }
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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      <WindowControls title={`任务日志 - ${currentProject?.name}`} onConfigChange={onConfigChange} />

      {/* 头部区域 */}
      <header style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(10px)',
        padding: '16px 32px',
        paddingTop: '52px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            icon={<LeftOutlined />} 
            onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
          >
            返回
          </Button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, flex: 1 }}>
            📋 {currentProject?.name}
          </h1>
          {currentProject?.memo ? (
            <div 
              onClick={onOpenProjectMemoView}
              style={{ 
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.2)',
                padding: '8px 16px',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                maxWidth: 300
              }}
            >
              <FileTextOutlined style={{ color: '#fff' }} />
              <span style={{ color: '#fff', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentProject.memo}
              </span>
            </div>
          ) : (
            <Button 
              icon={<EditOutlined />}
              onClick={onOpenAddProjectMemo}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
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
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />}
            onClick={onOpenAddTaskModal}
          >
            添加新任务
          </Button>
          <Button 
            type="primary"
            size="large"
            icon={<FileExcelOutlined />}
            onClick={onExportReport}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            导出今日日报
          </Button>
          <Button 
            type="default"
            size="large"
            icon={<EditOutlined />}
            onClick={onOpenEditModuleList}
            style={{ background: 'rgba(255,255,255,0.95)', borderColor: '#d9d9d9' }}
          >
            编辑模块
          </Button>
          
          <div style={{ flex: 1, display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <Tooltip 
              title={generateTaskTooltip(getTodayNewTasks())}
              placement="bottom"
              styles={{ root: { maxWidth: 400 } }}
            >
              <Card size="small" style={{ background: 'rgba(255,255,255,0.95)', minWidth: 120, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PlusOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>今日新增</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>{todayStats.newCount || 0}</div>
                  </div>
                </div>
              </Card>
            </Tooltip>
            <Tooltip 
              title={generateTaskTooltip(getTodayCompletedTasks())}
              placement="bottom"
              styles={{ root: { maxWidth: 400 } }}
            >
              <Card size="small" style={{ background: 'rgba(255,255,255,0.95)', minWidth: 120, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>今日完成</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{todayStats.count}</div>
                  </div>
                </div>
              </Card>
            </Tooltip>
            <Tooltip 
              title={generateTaskTooltip(pendingTasks)}
              placement="bottom"
              styles={{ root: { maxWidth: 400 } }}
            >
              <Card size="small" style={{ background: 'rgba(255,255,255,0.95)', minWidth: 120, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileTextOutlined style={{ fontSize: 18, color: '#faad14' }} />
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>待办任务</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14' }}>{pendingTasks.length}</div>
                  </div>
                </div>
              </Card>
            </Tooltip>
            <Tooltip 
              title={generateTaskTooltip([...pendingTasks, ...completedTasks])}
              placement="bottom"
              styles={{ root: { maxWidth: 400 } }}
            >
              <Card size="small" style={{ background: 'rgba(255,255,255,0.95)', minWidth: 120, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrophyOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                  <div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>总任务数</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#722ed1' }}>{pendingTasks.length + completedTasks.length}</div>
                  </div>
                </div>
              </Card>
            </Tooltip>
          </div>
        </div>

        {/* 任务列表 */}
        <Row gutter={24} style={{ flex: 1, overflow: 'hidden' }}>
          {/* 待办任务 */}
          <Col span={12} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>📌 待办任务 ({pendingTasks.length})</span>
                    {pendingTasksByModule.length > 0 && (
                      <span
                        onClick={handleToggleAllPending}
                        style={{ 
                          cursor: 'pointer',
                          color: '#8c8c8c',
                          fontSize: 12,
                          padding: '2px 8px',
                          borderRadius: 4,
                          transition: 'all 0.2s',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#1890ff'
                          e.currentTarget.style.background = 'rgba(24, 144, 255, 0.08)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#8c8c8c'
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        {allPendingExpanded ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
                        {allPendingExpanded ? '收起' : '展开'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Select
                      style={{ width: 120 }}
                      placeholder="筛选模块"
                      allowClear
                      value={selectedModuleFilter}
                      onChange={onModuleFilterChange}
                      options={modules.map(m => ({ label: m.name, value: m.name }))}
                    />
                    <Input
                      placeholder={getSearchPlaceholder()}
                      value={searchKeyword}
                      onChange={(e) => onSearchChange(e.target.value)}
                      prefix={<SearchOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />}
                      suffix={searchKeyword && <CloseCircleOutlined onClick={() => onSearchChange('')} style={{ cursor: 'pointer', fontSize: 14, color: '#8c8c8c' }} />}
                      style={{ 
                        width: 200,
                        borderRadius: 20,
                        paddingLeft: 16,
                        paddingRight: 16
                      }}
                      size="middle"
                    />
                  </div>
                </div>
              }
              style={{ background: 'rgba(255,255,255,0.95)', height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px' } }}
              classNames={{ body: styles.taskCardBody }}
            >
              {pendingTasks.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Empty
                    image={searchKeyword ? <SearchOutlined style={{ fontSize: 60, color: '#d9d9d9' }} /> : Empty.PRESENTED_IMAGE_SIMPLE}
                    description={searchKeyword ? `未找到包含"${searchKeyword}"的任务` : '暂无待办任务'}
                  />
                </div>
              ) : (
                pendingTasksByModule.map(group => {
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
                    />
                  )
                })
              )}
            </Card>
          </Col>

          {/* 已完成任务 */}
          <Col span={12} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Card 
              title={<span>✅ 已完成 ({completedTasks.length})</span>}
              style={{ background: 'rgba(255,255,255,0.95)', height: '100%', display: 'flex', flexDirection: 'column' }}
              styles={{ body: { flex: 1, overflowY: 'auto', padding: '16px' } }}
              classNames={{ body: styles.taskCardBody }}
            >
              {completedTasks.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="还没有完成的任务"
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
            </Card>
          </Col>
        </Row>
      </main>

      {/* 添加任务模态框 */}
      <TaskModal
        show={showAddTaskModal}
        isEdit={false}
        task={newTask}
        modules={modules}
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
        onRemoveExistingImage={() => {}}
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
      <ConfirmModal
        show={showDeleteConfirm}
        title="⚠️ 确认删除"
        message={`确定要删除任务「${taskToDelete?.name}」吗？`}
        warning="此操作无法撤销,相关图片也会被删除。"
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
      <ProjectMemoView
        show={showProjectMemoView}
        memo={editingProjectMemo?.memo || ''}
        projectName={editingProjectMemo?.name || ''}
        onEdit={onOpenProjectMemoEdit}
        onClose={onCloseProjectMemoView}
      />

      {/* 项目备忘编辑模态框 */}
      <ProjectMemoModal
        show={showProjectMemoModal}
        memo={editingProjectMemo?.memo || ''}
        projectName={editingProjectMemo?.name || ''}
        onMemoChange={onProjectMemoChange}
        onConfirm={onUpdateProjectMemo}
        onCancel={onCloseProjectMemoModal}
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
        onRestoreModule={onRestoreModuleInList}
        onReorderModules={onReorderModules}
        onClose={onCloseEditModuleList}
      />
    </div>
  )
}
