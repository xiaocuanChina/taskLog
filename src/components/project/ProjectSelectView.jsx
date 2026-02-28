/**
 * 项目选择视图组件 - 全新设计
 * 
 * 设计理念:
 * - 现代化Dashboard风格，数据密集型布局
 * - 左侧边栏：快速统计和筛选
 * - 主区域：项目卡片网格，支持多种视图模式
 * - 顶部：搜索栏和操作按钮
 * - 使用数据可视化展示项目进度
 * 
 * 功能特性:
 * - 实时搜索和筛选
 * - 项目统计数据展示
 * - 多种排序方式
 * - 快速操作菜单
 * - 响应式设计
 */
import React, { useState, useMemo, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Select, 
  Space, 
  Progress, 
  Tooltip, 
  Dropdown,
  Badge,
  Statistic,
  Row,
  Col
} from 'antd'
import { 
  PlusOutlined, 
  SearchOutlined,
  FolderOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import WindowControls from '../common/WindowControls'
import ProjectModal from './ProjectModal'
import ProjectMemo from './ProjectMemo'
import DeleteProjectModal from './DeleteProjectModal'
import styles from './ProjectSelectView.module.css'

// 可拖拽的项目卡片组件
function SortableProjectCard({ 
  project, 
  stats, 
  statusColor, 
  sortBy, 
  isDragging,
  onSelectProject, 
  getProjectMenu,
  onDragStart,
  onDragOver,
  onDragEnd
}) {
  return (
    <Dropdown menu={getProjectMenu(project)} trigger={['contextMenu']}>
      <div 
        className={`${styles.projectCard} ${isDragging ? styles.dragging : ''}`}
        onClick={() => onSelectProject(project)}
        draggable={sortBy === 'custom'}
        onDragStart={(e) => sortBy === 'custom' && onDragStart(e, project)}
        onDragOver={(e) => sortBy === 'custom' && onDragOver(e, project)}
        onDragEnd={onDragEnd}
      >
        {/* 卡片头部 */}
        <div className={styles.cardHeader}>
          <div className={styles.cardIcon} style={{ background: `${statusColor}15` }}>
            <FolderOutlined style={{ fontSize: 24, color: statusColor }} />
          </div>
          <Space size="small">
            <Dropdown menu={getProjectMenu(project)} trigger={['click']}>
              <Button 
                type="text" 
                size="small" 
                icon={<MoreOutlined />}
                className={styles.cardMenu}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Space>
        </div>

      {/* 项目名称 */}
      <div className={styles.cardTitle}>
        <Tooltip title={project.name}>
          <h3>{project.name}</h3>
        </Tooltip>
        {project.memo && (
          <Tooltip 
            title={
              <div style={{ whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                {project.memo}
              </div>
            }
          >
            <FileTextOutlined className={styles.memoIcon} />
          </Tooltip>
        )}
      </div>

      {/* 统计信息 */}
      <div className={styles.cardStats}>
        <div className={styles.statItem}>
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
          <span>{stats.completedTasks} 已完成</span>
        </div>
        <div className={styles.statItem}>
          <ClockCircleOutlined style={{ color: '#faad14' }} />
          <span>{stats.pendingTasks} 进行中</span>
        </div>
        {stats.shelvedTasks > 0 && (
          <div className={styles.statItem}>
            <ClockCircleOutlined style={{ color: '#ff7a45' }} />
            <span>{stats.shelvedTasks} 已搁置</span>
          </div>
        )}
      </div>

      {/* 进度条 - 分段显示已完成和已搁置 */}
      <div className={styles.cardProgress}>
        <Progress 
          percent={stats.totalProgress}
          success={{ percent: stats.completedProgress }}
          strokeColor="#ff7a45"
          size="small"
          showInfo={false}
        />
        <span className={styles.progressText}>{stats.totalProgress}%</span>
      </div>

      {/* 底部信息 */}
      <div className={styles.cardFooter}>
        <span className={styles.dateText}>
          <CalendarOutlined />
          {new Date(project.updatedAt || project.createdAt).toLocaleDateString('zh-CN')}
        </span>
        {stats.isCompleted && (
          <Badge status="success" text="已完成" />
        )}
      </div>
      </div>
    </Dropdown>
  )
}

export default function ProjectSelectView({
  projects,
  showAddProjectModal,
  showDeleteProjectConfirm,
  showProjectMemo,
  projectMemoMode,
  newProjectName,
  projectToDelete,
  editingProjectMemo,
  onSelectProject,
  onAddProject,
  onUpdateProjectName,
  onDeleteProject,
  onProjectNameChange,
  onCreateProject,
  onConfirmDeleteProject,
  onCancelDeleteProject,
  onProjectMemoChange,
  onUpdateProjectMemo,
  onCloseProjectMemo,
  onSwitchToEditMode,
  onCloseAddProjectModal,
  onProjectsReorder,
  onOpenProjectMemo
}) {
  // 视图模式
  const [viewMode, setViewMode] = useState('grid') // grid, list, compact
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState('')
  // 排序方式
  const [sortBy, setSortBy] = useState('custom') // custom, updateTime, name, progress, createTime
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState('all') // all, active, completed
  // 项目任务数据缓存
  const [projectTasksCache, setProjectTasksCache] = useState({})
  // 任务数据是否加载完成
  const [isTasksLoaded, setIsTasksLoaded] = useState(false)
  // 编辑项目名称模态框
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editingProjectName, setEditingProjectName] = useState('')
  // 拖动状态
  const [draggedProject, setDraggedProject] = useState(null)
  const [dragOverProject, setDragOverProject] = useState(null)

  // 加载项目的任务数据
  useEffect(() => {
    const loadProjectTasks = async () => {
      setIsTasksLoaded(false)
      const cache = {}
      for (const project of projects) {
        try {
          const tasks = await window.electron?.tasks?.list(project.id)
          cache[project.id] = tasks || []
        } catch (error) {
          console.error(`加载项目 ${project.id} 的任务失败:`, error)
          cache[project.id] = []
        }
      }
      setProjectTasksCache(cache)
      setIsTasksLoaded(true)
    }

    if (projects.length > 0) {
      loadProjectTasks()
    } else {
      // 如果没有项目，直接标记为已加载
      setIsTasksLoaded(true)
    }
  }, [projects])

  // 拖动开始
  const handleDragStart = (e, project) => {
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
    
    // 关闭可能打开的右键菜单 - 模拟 ESC 键按下
    const escEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      keyCode: 27,
      code: 'Escape',
      which: 27,
      bubbles: true,
      cancelable: true
    })
    document.dispatchEvent(escEvent)
  }

  // 拖动经过
  const handleDragOver = (e, project) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (draggedProject && draggedProject.id !== project.id) {
      setDragOverProject(project)
    }
  }

  // 拖动结束
  const handleDragEnd = () => {
    if (draggedProject && dragOverProject && draggedProject.id !== dragOverProject.id) {
      const oldIndex = filteredAndSortedProjects.findIndex(p => p.id === draggedProject.id)
      const newIndex = filteredAndSortedProjects.findIndex(p => p.id === dragOverProject.id)
      
      // 手动实现 arrayMove 逻辑
      const newProjects = [...filteredAndSortedProjects]
      const [removed] = newProjects.splice(oldIndex, 1)
      newProjects.splice(newIndex, 0, removed)
      
      onProjectsReorder(newProjects)
    }
    
    setDraggedProject(null)
    setDragOverProject(null)
  }

  // 计算项目统计信息 - 使用缓存的任务数据
  const getProjectStats = (project) => {
    const tasks = projectTasksCache[project.id] || []
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.completed).length // 使用 completed 字段
    const shelvedTasks = tasks.filter(t => t.shelved && !t.completed).length // 已搁置但未完成的任务
    const pendingTasks = tasks.filter(t => !t.completed && !t.shelved).length // 排除搁置任务
    const completedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const shelvedProgress = totalTasks > 0 ? Math.round((shelvedTasks / totalTasks) * 100) : 0
    // 总进度 = 已完成 + 已搁置
    const totalProgress = completedProgress + shelvedProgress
    
    // 统计模块数量（去重）
    const moduleNames = new Set(tasks.map(t => t.module).filter(Boolean))
    const totalModules = moduleNames.size
    
    // 统计图片数量
    const totalImages = tasks.reduce((count, task) => {
      return count + (task.images ? task.images.length : 0)
    }, 0)
    
    return { 
      totalTasks, 
      completedTasks,
      shelvedTasks,
      pendingTasks, 
      completedProgress,
      shelvedProgress,
      totalProgress,
      totalModules,
      totalImages,
      isCompleted: totalTasks > 0 && (completedTasks + shelvedTasks) === totalTasks,
      hasNoTasks: totalTasks === 0
    }
  }

  // 过滤和排序项目
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects]

    // 搜索过滤
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        (p.memo && p.memo.toLowerCase().includes(keyword))
      )
    }

    // 状态筛选
    if (filterStatus !== 'all') {
      result = result.filter(p => {
        const stats = getProjectStats(p)
        if (filterStatus === 'active') return !stats.isCompleted
        if (filterStatus === 'completed') return stats.isCompleted
        return true
      })
    }

    // 排序
    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    } else if (sortBy === 'createTime') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    } else if (sortBy === 'updateTime') {
      result.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    } else if (sortBy === 'progress') {
      result.sort((a, b) => {
        const progressA = getProjectStats(a).completedProgress
        const progressB = getProjectStats(b).completedProgress
        return progressB - progressA
      })
    }
    // custom 保持原有顺序（支持拖拽排序）

    return result
  }, [projects, searchKeyword, sortBy, filterStatus])

  // 计算全局统计 - 依赖任务数据加载状态
  const globalStats = useMemo(() => {
    // 如果任务数据还未加载完成，返回默认值
    if (!isTasksLoaded) {
      return {
        totalProjects: projects.length,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        shelvedTasks: 0,
        overallProgress: 0,
        shelvedProgress: 0,
        totalProgress: 0
      }
    }

    const totalProjects = projects.length
    const activeProjects = projects.filter(p => {
      const stats = getProjectStats(p)
      return !stats.isCompleted && !stats.hasNoTasks
    }).length
    const completedProjects = projects.filter(p => {
      const stats = getProjectStats(p)
      return stats.isCompleted
    }).length
    
    let totalTasks = 0
    let completedTasks = 0
    let shelvedTasks = 0
    projects.forEach(p => {
      const stats = getProjectStats(p)
      totalTasks += stats.totalTasks
      completedTasks += stats.completedTasks
      shelvedTasks += stats.shelvedTasks
    })

    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const shelvedProgress = totalTasks > 0 ? Math.round((shelvedTasks / totalTasks) * 100) : 0
    const totalProgress = overallProgress + shelvedProgress

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      shelvedTasks,
      overallProgress,
      shelvedProgress,
      totalProgress
    }
  }, [projects, isTasksLoaded, projectTasksCache])

  // 打开编辑项目名称模态框
  const handleOpenEditProject = (project) => {
    setEditingProject(project)
    setEditingProjectName(project.name)
    setShowEditProjectModal(true)
  }

  // 确认编辑项目名称
  const handleConfirmEditProject = () => {
    if (!editingProjectName.trim()) {
      return
    }
    if (editingProjectName !== editingProject.name) {
      onUpdateProjectName(editingProject.id, editingProjectName.trim())
    }
    setShowEditProjectModal(false)
    setEditingProject(null)
    setEditingProjectName('')
  }

  // 取消编辑项目名称
  const handleCancelEditProject = () => {
    setShowEditProjectModal(false)
    setEditingProject(null)
    setEditingProjectName('')
  }

  // 打开项目备忘模态框
  const handleOpenProjectMemo = (project) => {
    if (onOpenProjectMemo) {
      onOpenProjectMemo(project)
    }
  }

  // 项目操作菜单 - 修复事件冒泡问题
  const getProjectMenu = (project) => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑名称',
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation() // 阻止事件冒泡
          handleOpenEditProject(project)
        }
      },
      {
        key: 'memo',
        icon: <FileTextOutlined />,
        label: '项目备忘',
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation() // 阻止事件冒泡
          handleOpenProjectMemo(project)
        }
      },
      {
        type: 'divider'
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除项目',
        danger: true,
        onClick: ({ domEvent }) => {
          domEvent.stopPropagation() // 阻止事件冒泡
          onDeleteProject(project)
        }
      }
    ]
  })

  // 渲染项目卡片
  const renderProjectCard = (project) => {
    const stats = getProjectStats(project)
    const statusColor = stats.isCompleted ? '#52c41a' : stats.hasNoTasks ? '#d9d9d9' : '#1890ff'

    return (
      <SortableProjectCard
        key={project.id}
        project={project}
        stats={stats}
        statusColor={statusColor}
        sortBy={sortBy}
        isDragging={draggedProject?.id === project.id}
        onSelectProject={onSelectProject}
        getProjectMenu={getProjectMenu}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      />
    )
  }

  // 渲染列表项
  const renderProjectListItem = (project) => {
    const stats = getProjectStats(project)
    const statusColor = stats.isCompleted ? '#52c41a' : stats.hasNoTasks ? '#d9d9d9' : '#1890ff'

    return (
      <Dropdown key={project.id} menu={getProjectMenu(project)} trigger={['contextMenu']}>
        <div 
          className={`${styles.listItem} ${draggedProject?.id === project.id ? styles.dragging : ''}`}
          onClick={() => onSelectProject(project)}
          draggable={sortBy === 'custom'}
          onDragStart={(e) => sortBy === 'custom' && handleDragStart(e, project)}
          onDragOver={(e) => sortBy === 'custom' && handleDragOver(e, project)}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.listIcon} style={{ background: `${statusColor}15` }}>
            <FolderOutlined style={{ fontSize: 20, color: statusColor }} />
          </div>
          
          <div className={styles.listContent}>
            <div className={styles.listHeader}>
              <h4>{project.name}</h4>
              {project.memo && (
                <Tooltip 
                  title={
                    <div style={{ whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                      {project.memo}
                    </div>
                  }
                >
                  <FileTextOutlined className={styles.memoIcon} />
                </Tooltip>
              )}
            </div>
            
            <div className={styles.listMeta}>
              <Space size="large">
                <span>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                  {stats.completedTasks}/{stats.totalTasks} 任务
                </span>
                <span>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {new Date(project.updatedAt || project.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </Space>
            </div>
          </div>

          <div className={styles.listProgress}>
            <Progress 
              type="circle" 
              percent={stats.completedProgress + stats.shelvedProgress}
              success={{ percent: stats.completedProgress }}
              strokeColor="#ff7a45"
              width={50}
            />
          </div>

          <Dropdown menu={getProjectMenu(project)} trigger={['click']}>
            <Button 
              type="text" 
              icon={<MoreOutlined />}
              className={styles.listMenu}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        </div>
      </Dropdown>
    )
  }

  return (
    <div className={styles.container}>
      <WindowControls title="任务日志" />

      <div className={styles.layout}>
        {/* 左侧边栏 */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>
              <BarChartOutlined />
              项目概览
            </h2>
          </div>

          {/* 统计卡片 */}
          <div className={styles.statsCards}>
            <div className={styles.statCard}>
              <Statistic 
                title="总项目数" 
                value={globalStats.totalProjects}
                prefix={<FolderOutlined />}
                styles={{ value: { color: '#1890ff' } }}
              />
            </div>
            
            <div className={styles.statCard}>
              <Statistic 
                title="进行中" 
                value={globalStats.activeProjects}
                prefix={<ClockCircleOutlined />}
                styles={{ value: { color: '#faad14' } }}
              />
            </div>
            
            <div className={styles.statCard}>
              <Statistic 
                title="已完成" 
                value={globalStats.completedProjects}
                prefix={<CheckCircleOutlined />}
                styles={{ value: { color: '#52c41a' } }}
              />
            </div>

            <div className={styles.statCard}>
              <Statistic 
                title="总任务数" 
                value={globalStats.totalTasks}
                suffix={`/ ${globalStats.completedTasks} 完成`}
              />
              <Progress 
                percent={globalStats.overallProgress + globalStats.shelvedProgress}
                success={{ percent: globalStats.overallProgress }}
                strokeColor="#ff7a45"
                size="small"
                style={{ marginTop: 8 }}
              />
              {globalStats.shelvedTasks > 0 && (
                <div style={{ fontSize: 12, color: '#ff7a45', marginTop: 4 }}>
                  {globalStats.shelvedTasks} 个任务已搁置
                </div>
              )}
            </div>
          </div>

          {/* 筛选器 */}
          <div className={styles.filters}>
            <h3>筛选</h3>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%', marginBottom: 12 }}
              options={[
                { label: '全部项目', value: 'all' },
                { label: '进行中', value: 'active' },
                { label: '已完成', value: 'completed' }
              ]}
            />
            
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              options={[
                { label: '自定义排序（拖拽）', value: 'custom' },
                { label: '最近更新', value: 'updateTime' },
                { label: '按名称', value: 'name' },
                { label: '按进度', value: 'progress' },
                { label: '创建时间', value: 'createTime' }
              ]}
            />
          </div>
        </aside>

        {/* 主内容区 */}
        <main className={styles.main}>
          {/* 顶部工具栏 */}
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <h1>我的项目</h1>
              <Badge count={filteredAndSortedProjects.length} showZero style={{ backgroundColor: '#52c41a' }} />
            </div>

            <Space size="middle">
              <Input
                placeholder="搜索项目..."
                prefix={<SearchOutlined />}
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{ width: 250 }}
                className={styles.searchInput}
              />

              <Space.Compact>
                <Button 
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                />
                <Button 
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                />
              </Space.Compact>

              <Button 
                type="primary" 
                size="large"
                icon={<PlusOutlined />}
                onClick={onAddProject}
              >
                新建项目
              </Button>
            </Space>
          </div>

          {/* 项目列表 */}
          <div className={styles.content}>
            {filteredAndSortedProjects.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  {searchKeyword ? <SearchOutlined /> : <FolderOpenOutlined />}
                </div>
                <h3 className={styles.emptyTitle}>
                  {searchKeyword ? '未找到匹配的项目' : '还没有项目'}
                </h3>
                <p className={styles.emptyDesc}>
                  {searchKeyword 
                    ? '尝试使用其他关键词搜索，或清空搜索条件查看所有项目' 
                    : '创建你的第一个项目，开始高效管理任务'}
                </p>
                {!searchKeyword && (
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={onAddProject}
                    className={styles.emptyButton}
                  >
                    创建第一个项目
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              // 网格视图
              <div className={styles.gridView}>
                {filteredAndSortedProjects.map(renderProjectCard)}
              </div>
            ) : (
              <div className={styles.listView}>
                {filteredAndSortedProjects.map(renderProjectListItem)}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 模态框 */}
      <ProjectModal
        show={showAddProjectModal}
        isEdit={false}
        projectName={newProjectName}
        onNameChange={onProjectNameChange}
        onConfirm={onCreateProject}
        onCancel={onCloseAddProjectModal}
      />

      {/* 编辑项目名称模态框 */}
      <ProjectModal
        show={showEditProjectModal}
        isEdit={true}
        projectName={editingProjectName}
        onNameChange={setEditingProjectName}
        onConfirm={handleConfirmEditProject}
        onCancel={handleCancelEditProject}
      />

      <DeleteProjectModal
        show={showDeleteProjectConfirm}
        project={projectToDelete}
        projectStats={projectToDelete ? getProjectStats(projectToDelete) : null}
        onConfirm={onConfirmDeleteProject}
        onCancel={onCancelDeleteProject}
      />

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
    </div>
  )
}
