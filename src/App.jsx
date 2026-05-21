import React, { useEffect, useState } from 'react'
import ProjectSelectView from './components/project/ProjectSelectView'
import TaskManageView from './components/task/TaskManageView'
import WindowControls from './components/common/WindowControls'
import { useTaskModal } from './hooks/useTaskModal'
import { useTaskManager } from './hooks/useTaskManager'
import { getConfig } from './utils/configManager'
import { useToast } from './context/ToastContext'

export default function App() {
  // 视图状态
  const [currentView, setCurrentView] = useState('project-select')
  const [currentProject, setCurrentProject] = useState(null)

  // 配置状态
  const [taskTypes, setTaskTypes] = useState([])
  const [taskTypeColors, setTaskTypeColors] = useState({})

  // 项目相关状态
  const [projects, setProjects] = useState([])
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [projectToDelete, setProjectToDelete] = useState(null)

  // 项目备忘相关状态
  const [showProjectMemo, setShowProjectMemo] = useState(false)
  const [projectMemoMode, setProjectMemoMode] = useState('view') // 'view' 或 'edit'
  const [editingProjectMemo, setEditingProjectMemo] = useState(null)

  // Toast 提示
  const showToast = useToast()

  // 图片预览
  const [imagePreview, setImagePreview] = useState({ show: false, src: '', currentIndex: 0, images: [] })

  // 删除任务确认
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState(null)

  // 编辑任务模块
  const [showEditTaskModuleModal, setShowEditTaskModuleModal] = useState(false)
  const [editingTaskModule, setEditingTaskModule] = useState(null)

  // 编辑模块列表
  const [showEditModuleListModal, setShowEditModuleListModal] = useState(false)

  // 导出未完成任务
  const [showExportPendingModal, setShowExportPendingModal] = useState(false)

  // 统计报表模态框
  const [showStatsModal, setShowStatsModal] = useState(false)

  // 使用自定义 Hooks
  const taskModalHook = useTaskModal(taskTypes)
  const taskManagerHook = useTaskManager(currentProject)

  // 加载配置
  const loadConfig = async () => {
    const config = await getConfig()
    setTaskTypes([...config.taskTypes])

    // 构建任务类型颜色映射
    const colorMap = {}
    config.taskTypes.forEach(type => {
      // 确保颜色值是字符串，如果是对象则使用默认颜色
      let color = type.color
      if (typeof color === 'object' && color !== null) {
        // 如果颜色是对象，使用默认颜色
        color = '#1890ff'
      }
      colorMap[type.name] = color
    })
    setTaskTypeColors({ ...colorMap })

    // 应用主题模式
    const theme = config.general?.theme || 'light'
    document.documentElement.setAttribute('data-theme', theme)
    console.log('应用主题模式:', theme)

    // 应用主题色到 CSS 变量
    const themeColors = config.general?.themeColors
    console.log('加载主题色配置:', themeColors)
    if (themeColors) {
      const { startColor, endColor } = themeColors
      console.log('应用主题色:', startColor, endColor)
      document.documentElement.style.setProperty('--theme-start-color', startColor || '#667eea')
      document.documentElement.style.setProperty('--theme-end-color', endColor || '#764ba2')
    }
  }

  // 加载项目列表
  const loadProjects = async () => {
    const list = await window.electron?.projects?.list()
    setProjects(list || [])
  }

  // 配置变化时刷新
  const handleConfigChange = () => {
    loadConfig()
  }

  useEffect(() => {
    loadConfig()
    loadProjects()
  }, [])

  // ========== 项目相关处理函数 ==========

  // 创建项目
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      showToast('请输入项目名称', 'error')
      return
    }
    await window.electron?.projects?.add({ name: newProjectName })
    setNewProjectName('')
    setShowAddProjectModal(false)
    loadProjects()
    showToast('项目创建成功！')
  }

  // 选择项目
  const handleSelectProject = (project) => {
    setCurrentProject(project)
    setCurrentView('task-manage')
  }

  // 返回项目选择
  const handleBackToProjects = () => {
    setCurrentProject(null)
    setCurrentView('project-select')
  }

  // 行内编辑更新项目名称
  const handleUpdateProjectName = async (projectId, newName) => {
    if (!newName.trim()) {
      showToast('请输入项目名称', 'error')
      return
    }

    const result = await window.electron?.projects?.update({
      id: projectId,
      name: newName
    })

    if (result?.success) {
      loadProjects()
      if (currentProject?.id === projectId) {
        setCurrentProject({ ...currentProject, name: newName })
      }
      showToast('项目名称更新成功！')
    } else {
      showToast(result?.error || '更新失败', 'error')
    }
  }

  // 打开删除项目确认框
  const handleOpenDeleteProjectConfirm = (project) => {
    setProjectToDelete(project)
    setShowDeleteProjectConfirm(true)
  }

  // 确认删除项目
  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return

    const result = await window.electron?.projects?.delete(projectToDelete.id)

    if (result?.success) {
      setShowDeleteProjectConfirm(false)
      setProjectToDelete(null)
      loadProjects()
      showToast('项目已删除！')
    } else {
      showToast(result?.error || '删除失败', 'error')
      setShowDeleteProjectConfirm(false)
      setProjectToDelete(null)
    }
  }

  // 取消删除项目
  const handleCancelDeleteProject = () => {
    setShowDeleteProjectConfirm(false)
    setProjectToDelete(null)
  }

  // 处理项目重新排序
  const handleProjectsReorder = async (newProjects) => {
    setProjects(newProjects)
    // TODO: 调用后端API保存新的排序
    await window.electron?.projects?.reorder(newProjects.map(p => p.id))
  }

  // 从项目选择页面打开项目备忘（编辑模式）
  const handleOpenProjectMemoFromSelect = (project) => {
    setEditingProjectMemo({
      id: project.id,
      name: project.name,
      memo: project.memo || ''
    })
    setProjectMemoMode('edit')
    setShowProjectMemo(true)
  }

  // 打开项目备忘查看
  const handleOpenProjectMemoView = () => {
    setEditingProjectMemo({
      id: currentProject.id,
      name: currentProject.name,
      memo: currentProject.memo || ''
    })
    setProjectMemoMode('view')
    setShowProjectMemo(true)
  }

  // 切换到编辑模式
  const handleSwitchToEditMode = () => {
    setProjectMemoMode('edit')
  }

  // 关闭项目备忘
  const handleCloseProjectMemo = () => {
    setShowProjectMemo(false)
    setEditingProjectMemo(null)
    setProjectMemoMode('view')
  }

  // 更新项目备忘
  const handleUpdateProjectMemo = async () => {
    const result = await window.electron?.projects?.update({
      id: editingProjectMemo.id,
      memo: editingProjectMemo.memo
    })

    if (result?.success) {
      setShowProjectMemo(false)
      setEditingProjectMemo(null)
      setProjectMemoMode('view')
      loadProjects()
      if (currentProject?.id === editingProjectMemo.id) {
        setCurrentProject({ ...currentProject, memo: editingProjectMemo.memo })
      }
      showToast('备忘更新成功！')
    } else {
      showToast(result?.error || '更新失败', 'error')
    }
  }

  // ========== 任务相关处理函数 ==========

  // 添加任务
  const handleAddTask = async () => {
    if (!taskModalHook.newTask.name.trim()) {
      showToast('请输入任务描述', 'error')
      return
    }

    if (!taskModalHook.newTask.module.trim()) {
      showToast('请输入任务所属模块', 'error')
      return
    }

    await window.electron?.modules?.add({
      name: taskModalHook.newTask.module,
      projectId: currentProject.id
    })

    const payload = {
      projectId: currentProject.id,
      module: taskModalHook.newTask.module,
      name: taskModalHook.newTask.name,
      type: taskModalHook.newTask.type,
      initiator: taskModalHook.newTask.initiator,
      remark: taskModalHook.newTask.remark,
      images: [],
      attachments: [],
      codeBlock: taskModalHook.newTask.codeBlock,
      checkItems: taskModalHook.newTask.checkItems
    }

    if (taskModalHook.newTask.images.length > 0) {
      const imgPromises = taskModalHook.newTask.images.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              buffer: e.target.result
            })
          }
          reader.readAsArrayBuffer(file)
        })
      })
      payload.images = await Promise.all(imgPromises)
    }

    if (taskModalHook.newTask.attachments.length > 0) {
      const attPromises = taskModalHook.newTask.attachments.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              size: file.size,
              buffer: e.target.result
            })
          }
          reader.readAsArrayBuffer(file)
        })
      })
      payload.attachments = await Promise.all(attPromises)
    }

    await window.electron?.tasks?.add(payload)
    taskModalHook.resetNewTaskForm()
    taskModalHook.setShowAddTaskModal(false)
    await taskManagerHook.refreshData()
    showToast('任务添加成功！')
  }

  // 标记完成
  const handleMarkDone = async (id) => {
    await window.electron?.tasks?.markDone(id)
    await taskManagerHook.refreshData()
    showToast('任务已完成！')
  }

  // 回滚任务状态
  const handleRollback = async (id) => {
    await window.electron?.tasks?.rollback(id)
    await taskManagerHook.refreshData()
    showToast('任务已回滚到待办！')
  }

  // 搁置任务
  const handleShelveTask = async (id) => {
    await window.electron?.tasks?.shelve(id)
    await taskManagerHook.refreshData()
    showToast('任务已搁置！')
  }

  // 取消搁置任务
  const handleUnshelveTask = async (id) => {
    await window.electron?.tasks?.unshelve(id)
    await taskManagerHook.refreshData()
    showToast('任务已取消搁置！')
  }

  // 置顶任务
  const handlePinTask = async (id) => {
    await window.electron?.tasks?.pin(id)
    await taskManagerHook.refreshData()
    showToast('任务已置顶！')
  }

  // 取消置顶任务
  const handleUnpinTask = async (id) => {
    await window.electron?.tasks?.unpin(id)
    await taskManagerHook.refreshData()
    showToast('已取消置顶！')
  }

  // 打开编辑任务模态框
  const handleEditTask = (task) => {
    taskModalHook.setEditingTask({
      id: task.id,
      module: task.module,
      name: task.name,
      type: task.type || '',
      initiator: task.initiator,
      remark: task.remark || '',
      images: [],
      existingImages: task.images || [],
      attachments: [],
      existingAttachments: task.attachments || [],
      codeBlock: task.codeBlock ? {
        enabled: task.codeBlock.enabled || false,
        language: task.codeBlock.language || 'javascript',
        code: task.codeBlock.code || ''
      } : {
        enabled: false,
        language: 'javascript',
        code: ''
      },
      checkItems: task.checkItems ? {
        enabled: task.checkItems.enabled || false,
        mode: task.checkItems.mode || 'multiple',
        linkage: task.checkItems.linkage,
        items: task.checkItems.items || [],
        newItemName: ''
      } : {
        enabled: false,
        mode: 'multiple',
        linkage: true,
        items: [],
        newItemName: ''
      }
    })
    taskModalHook.setShowEditTaskModal(true)
  }

  // 快速添加任务(指定模块)
  const handleQuickAddTask = (moduleName) => {
    taskModalHook.setNewTask({
      ...taskModalHook.newTask,
      module: moduleName
    })
    taskModalHook.setShowAddTaskModal(true)
  }

  // 打开编辑任务模块模态框
  const handleOpenEditTaskModule = (task) => {
    setEditingTaskModule(task)
    setShowEditTaskModuleModal(true)
  }

  // 确认修改任务模块
  const handleConfirmEditTaskModule = async (taskId, newModule) => {
    if (!newModule.trim()) {
      showToast('模块名称不能为空', 'error')
      return
    }

    // 先确保模块存在
    await window.electron?.modules?.add({
      name: newModule.trim(),
      projectId: currentProject.id
    })

    // 更新任务的模块
    const result = await window.electron?.tasks?.updateModule({
      id: taskId,
      module: newModule.trim()
    })

    if (result?.success) {
      setShowEditTaskModuleModal(false)
      setEditingTaskModule(null)
      await taskManagerHook.refreshData()
      showToast('任务模块修改成功！')
    } else {
      showToast(result?.error || '修改失败', 'error')
    }
  }

  // 关闭编辑任务模块模态框
  const handleCloseEditTaskModule = () => {
    setShowEditTaskModuleModal(false)
    setEditingTaskModule(null)
  }

  // 打开编辑模块列表模态框
  const handleOpenEditModuleList = () => {
    setShowEditModuleListModal(true)
  }

  // 关闭编辑模块列表模态框
  const handleCloseEditModuleList = () => {
    setShowEditModuleListModal(false)
  }

  // 在模块列表中更新模块
  const handleUpdateModuleInList = async (moduleId, newName) => {
    if (!newName.trim()) {
      showToast('模块名称不能为空', 'error')
      return
    }

    const result = await window.electron?.modules?.update({
      id: moduleId,
      projectId: currentProject.id,
      name: newName.trim()
    })

    if (result?.success) {
      showToast('模块名称修改成功', 'success')
      await taskManagerHook.refreshData()
    } else {
      showToast(result?.error || '模块名称修改失败', 'error')
    }
  }

  // 在模块列表中删除模块
  // 移入回收站
  const handleDeleteModuleInList = async (moduleId) => {
    const result = await window.electron?.modules?.delete(moduleId)

    if (result?.success) {
      showToast('模块已移入回收站', 'success')
      await taskManagerHook.refreshData()
    } else {
      showToast(result?.error || '操作失败', 'error')
    }
  }

  // 永久删除模块
  const handlePermanentDeleteModuleInList = async (moduleId) => {
    const result = await window.electron?.modules?.permanentDelete(moduleId)

    if (result?.success) {
      showToast('模块已永久删除', 'success')
      await taskManagerHook.refreshData()
    } else {
      showToast(result?.error || '删除失败', 'error')
    }
  }

  // 恢复模块
  const handleRestoreModuleInList = async (moduleId) => {
    const result = await window.electron?.modules?.restore(moduleId)

    if (result?.success) {
      showToast('模块已恢复', 'success')
      await taskManagerHook.refreshData()
    } else {
      showToast(result?.error || '模块恢复失败', 'error')
    }
  }

  // 新增模块
  const handleAddModuleInList = async (moduleName) => {
    const result = await window.electron?.modules?.add({
      name: moduleName,
      projectId: currentProject.id
    })

    if (result?.success !== false) {
      await taskManagerHook.refreshData()
    } else {
      throw new Error(result?.error || '模块添加失败')
    }
  }

  // 重新排序模块
  const handleReorderModules = async (reorderedModules) => {
    const moduleIds = reorderedModules.map(m => m.id)
    const result = await window.electron?.modules?.reorder({
      projectId: currentProject.id,
      moduleIds
    })

    if (result?.success) {
      await taskManagerHook.refreshData()
    } else {
      showToast(result?.error || '模块排序失败', 'error')
    }
  }

  // 处理勾选项变更
  const handleCheckItemChange = async (taskId, newItems) => {
    const result = await window.electron?.tasks?.updateCheckItems({
      taskId,
      checkItems: newItems
    })

    if (result?.success) {
      await taskManagerHook.refreshData()
    }
  }


  // 更新任务
  const handleUpdateTask = async () => {
    if (!taskModalHook.editingTask.name.trim()) {
      showToast('请输入任务描述', 'error')
      return
    }

    if (!taskModalHook.editingTask.module.trim()) {
      showToast('请输入任务所属模块', 'error')
      return
    }

    await window.electron?.modules?.add({
      name: taskModalHook.editingTask.module,
      projectId: currentProject.id
    })

    const payload = {
      id: taskModalHook.editingTask.id,
      projectId: currentProject.id,
      module: taskModalHook.editingTask.module,
      name: taskModalHook.editingTask.name,
      type: taskModalHook.editingTask.type,
      initiator: taskModalHook.editingTask.initiator,
      remark: taskModalHook.editingTask.remark,
      images: [],
      existingImages: taskModalHook.editingTask.existingImages,
      attachments: [],
      existingAttachments: taskModalHook.editingTask.existingAttachments,
      codeBlock: taskModalHook.editingTask.codeBlock,
      checkItems: taskModalHook.editingTask.checkItems
    }

    if (taskModalHook.editingTask.images.length > 0) {
      const imgPromises = taskModalHook.editingTask.images.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              buffer: e.target.result
            })
          }
          reader.readAsArrayBuffer(file)
        })
      })
      payload.images = await Promise.all(imgPromises)
    }

    if (taskModalHook.editingTask.attachments.length > 0) {
      const attPromises = taskModalHook.editingTask.attachments.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              size: file.size,
              buffer: e.target.result
            })
          }
          reader.readAsArrayBuffer(file)
        })
      })
      payload.attachments = await Promise.all(attPromises)
    }

    await window.electron?.tasks?.update(payload)
    taskModalHook.setEditingTask(null)
    taskModalHook.setShowEditTaskModal(false)
    await taskManagerHook.refreshData()
    showToast('任务更新成功！')
  }

  // 导出今日日报
  const handleExportReport = async () => {
    const result = await window.electron?.tasks?.exportTodayReport(currentProject.id)
    if (result?.success) {
      showToast(
        <span>
          {/* 日报已保存到: {result.path} */}
          日报导出成功！
          <a
            style={{ marginLeft: 8 }}
            onClick={() => window.electron?.shell?.showItemInFolder(result.path)}
          >
            打开目录
          </a>
        </span>
      )
    }
  }

  // 导出未完成任务
  const handleExportPendingTasks = async (selectedModules, format = 'excel', selectedTaskIds = []) => {
    setShowExportPendingModal(false)
    const result = await window.electron?.tasks?.exportPendingTasks({
      projectId: currentProject.id,
      modules: selectedModules,
      format: format,
      taskIds: selectedTaskIds
    })
    if (result?.success) {
      const formatLabel = format === 'excel' ? 'Excel' : 'Markdown'
      showToast(
        <span>
          {/* 📊 未完成任务({formatLabel})已保存到: {result.path} */}
          📊 未完成任务导出成功！
          <a
            style={{ marginLeft: 8 }}
            onClick={() => window.electron?.shell?.showItemInFolder(result.path)}
          >
            打开目录
          </a>
        </span>
      )
    } else {
      showToast(result?.error || '导出失败', 'error')
    }
  }

  // 打开删除确认框
  const handleOpenDeleteConfirm = (task) => {
    setTaskToDelete(task)
    setShowDeleteConfirm(true)
  }

  // 确认删除任务
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return

    await window.electron?.tasks?.delete(taskToDelete.id)
    setShowDeleteConfirm(false)
    setTaskToDelete(null)
    await taskManagerHook.refreshData()
    showToast('任务已删除！')
  }

  // 取消删除
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setTaskToDelete(null)
  }

  // ========== 图片预览相关 ==========

  // 打开图片预览
  // 使用系统默认程序打开附件
  const handleOpenAttachment = async (storedName) => {
    try {
      const filePath = await window.electron?.attachment?.getPath(storedName)
      if (filePath) {
        const result = await window.electron?.shell?.openPath(filePath)
        // shell.openPath 成功返回空字符串，失败返回错误信息
        if (result) {
          showToast('无法打开该附件: ' + result, 'error')
        }
      }
    } catch (err) {
      showToast('打开附件失败', 'error')
    }
  }

  const handleOpenImagePreview = (imageSrc, allImages, currentIndex, onDelete) => {
    setImagePreview({
      show: true,
      src: imageSrc,
      currentIndex: currentIndex,
      images: allImages,
      onDelete: onDelete ? (deleteIndex) => {
        // 调用删除回调，并获取更新后的图片列表
        const updatedImages = onDelete(deleteIndex)

        // 使用函数式更新来确保获取最新的 imagePreview 状态
        setImagePreview(prev => {
          const newImages = updatedImages || []
          if (newImages.length === 0) {
            return { ...prev, show: false, src: '', currentIndex: 0, images: [] }
          }

          // 计算新的索引
          // 如果当前索引大于删除的索引，说明删除的是前面的图片，当前索引需要减一
          // 如果当前索引等于删除的索引，说明删除的是当前图片，索引不变（即显示下一张），除非是最后一张
          let newIndex = prev.currentIndex

          if (newIndex > deleteIndex) {
            newIndex = newIndex - 1
          } else if (newIndex === deleteIndex) {
            if (newIndex >= newImages.length) {
              newIndex = newImages.length - 1
            }
          }

          return {
            ...prev,
            images: newImages,
            src: newImages[newIndex],
            currentIndex: newIndex
          }
        })
      } : undefined
    })
  }

  // 关闭图片预览
  const handleCloseImagePreview = () => {
    setImagePreview({ show: false, src: '', currentIndex: 0, images: [], onDelete: null })
  }

  // 切换到上一张图片
  const handlePrevImage = () => {
    setImagePreview(prev => {
      const newIndex = prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.images.length - 1
      return {
        ...prev,
        currentIndex: newIndex,
        src: prev.images[newIndex]
      }
    })
  }

  // 切换到下一张图片
  const handleNextImage = () => {
    setImagePreview(prev => {
      const newIndex = prev.currentIndex < prev.images.length - 1 ? prev.currentIndex + 1 : 0
      return {
        ...prev,
        currentIndex: newIndex,
        src: prev.images[newIndex]
      }
    })
  }

  // 渲染视图
  if (currentView === 'project-select') {
    return (
      <>
        <WindowControls title="TaskLog - 项目选择" onConfigChange={handleConfigChange} />
        <ProjectSelectView
          projects={projects}
          showAddProjectModal={showAddProjectModal}
          showDeleteProjectConfirm={showDeleteProjectConfirm}
          showProjectMemo={showProjectMemo}
          projectMemoMode={projectMemoMode}
          newProjectName={newProjectName}
          projectToDelete={projectToDelete}
          editingProjectMemo={editingProjectMemo}
          onSelectProject={handleSelectProject}
          onAddProject={() => setShowAddProjectModal(true)}
          onUpdateProjectName={handleUpdateProjectName}
          onDeleteProject={handleOpenDeleteProjectConfirm}
          onProjectNameChange={setNewProjectName}
          onCreateProject={handleCreateProject}
          onConfirmDeleteProject={handleConfirmDeleteProject}
          onCancelDeleteProject={handleCancelDeleteProject}
          onProjectMemoChange={(memo) => setEditingProjectMemo({ ...editingProjectMemo, memo })}
          onUpdateProjectMemo={handleUpdateProjectMemo}
          onCloseProjectMemo={handleCloseProjectMemo}
          onSwitchToEditMode={handleSwitchToEditMode}
          onCloseAddProjectModal={() => setShowAddProjectModal(false)}
          onProjectsReorder={handleProjectsReorder}
          onOpenProjectMemo={handleOpenProjectMemoFromSelect}
        />
      </>
    )
  }

  // 任务管理界面
  return (
    <TaskManageView
      taskTypes={taskTypes}
      taskTypeColors={taskTypeColors}
      onConfigChange={handleConfigChange}
      currentProject={currentProject}
      todayStats={taskManagerHook.todayStats}
      tasks={taskManagerHook.tasks}
      pendingTasks={taskManagerHook.pendingTasks}
      completedTasks={taskManagerHook.completedTasks}
      searchKeyword={taskManagerHook.searchKeyword}
      selectedModuleFilter={taskManagerHook.selectedModuleFilter}
      completedSearchKeyword={taskManagerHook.completedSearchKeyword}
      completedModuleFilter={taskManagerHook.completedModuleFilter}
      collapsedModules={taskManagerHook.collapsedModules}
      editingModuleName={taskManagerHook.editingModuleName}
      showAddTaskModal={taskModalHook.showAddTaskModal}
      showEditTaskModal={taskModalHook.showEditTaskModal}
      showDeleteConfirm={showDeleteConfirm}
      showProjectMemo={showProjectMemo}
      projectMemoMode={projectMemoMode}
      showEditTaskModuleModal={showEditTaskModuleModal}
      showEditModuleListModal={showEditModuleListModal}
      newTask={taskModalHook.newTask}
      editingTask={taskModalHook.editingTask}
      taskToDelete={taskToDelete}
      editingProjectMemo={editingProjectMemo}
      editingTaskModule={editingTaskModule}
      modules={taskManagerHook.modules}
      recycleModules={taskManagerHook.recycleModules}
      showModuleDropdown={taskModalHook.showModuleDropdown}
      showEditModuleDropdown={taskModalHook.showEditModuleDropdown}
      showTypeDropdown={taskModalHook.showTypeDropdown}
      showEditTypeDropdown={taskModalHook.showEditTypeDropdown}
      dragActive={taskModalHook.dragActive}
      imagePreview={imagePreview}
      taskRefs={taskModalHook.taskRefs}
      editTaskRefs={taskModalHook.editTaskRefs}
      onBack={handleBackToProjects}
      onAddTask={handleAddTask}
      onExportReport={handleExportReport}
      onExportPendingTasks={handleExportPendingTasks}
      showExportPendingModal={showExportPendingModal}
      onOpenExportPendingModal={() => setShowExportPendingModal(true)}
      onCloseExportPendingModal={() => setShowExportPendingModal(false)}
      showStatsModal={showStatsModal}
      onOpenStats={() => setShowStatsModal(true)}
      onCloseStats={() => setShowStatsModal(false)}
      onSearchChange={taskManagerHook.setSearchKeyword}
      onModuleFilterChange={taskManagerHook.setSelectedModuleFilter}
      onCompletedSearchChange={taskManagerHook.setCompletedSearchKeyword}
      onCompletedModuleFilterChange={taskManagerHook.setCompletedModuleFilter}
      onToggleModuleCollapse={taskManagerHook.toggleModuleCollapse}
      onStartEditModuleName={taskManagerHook.startEditModuleName}
      onEditModuleNameChange={(newName) => taskManagerHook.setEditingModuleName({ ...taskManagerHook.editingModuleName, newName })}
      onSaveModuleName={() => taskManagerHook.saveModuleName(showToast)}
      onCancelEditModuleName={taskManagerHook.cancelEditModuleName}
      onTaskComplete={handleMarkDone}
      onTaskRollback={handleRollback}
      onTaskEdit={handleEditTask}
      onTaskDelete={handleOpenDeleteConfirm}
      onImageClick={handleOpenImagePreview}
      onOpenAddTaskModal={() => taskModalHook.setShowAddTaskModal(true)}
      onQuickAddTask={handleQuickAddTask}
      onCloseAddTaskModal={() => {
        taskModalHook.setShowAddTaskModal(false)
        taskModalHook.resetNewTaskForm()
      }}
      onNewTaskChange={taskModalHook.setNewTask}
      onModuleDropdownToggle={taskModalHook.setShowModuleDropdown}
      onTypeDropdownToggle={taskModalHook.setShowTypeDropdown}
      onModuleSelect={(name) => {
        taskModalHook.setNewTask({ ...taskModalHook.newTask, module: name })
        taskModalHook.setShowModuleDropdown(false)
      }}
      onTypeSelect={(type) => {
        taskModalHook.setNewTask({ ...taskModalHook.newTask, type })
        taskModalHook.setShowTypeDropdown(false)
      }}
      onImageChange={(e) => {
        const files = Array.from(e.target.files)
        taskModalHook.setNewTask({ ...taskModalHook.newTask, images: [...taskModalHook.newTask.images, ...files] })
      }}
      onRemoveImage={(index) => {
        const newImages = [...taskModalHook.newTask.images]
        newImages.splice(index, 1)
        taskModalHook.setNewTask({ ...taskModalHook.newTask, images: newImages })
      }}
      onDrag={taskModalHook.handleDrag}
      onDrop={(e) => taskModalHook.handleDrop(e, false)}
      onPaste={(e) => taskModalHook.handlePaste(e, false)}
      onConfirmAddTask={handleAddTask}
      onEditTaskChange={taskModalHook.setEditingTask}
      onEditModuleDropdownToggle={taskModalHook.setShowEditModuleDropdown}
      onEditTypeDropdownToggle={taskModalHook.setShowEditTypeDropdown}
      onEditModuleSelect={(name) => {
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, module: name })
        taskModalHook.setShowEditModuleDropdown(false)
      }}
      onEditTypeSelect={(type) => {
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, type })
        taskModalHook.setShowEditTypeDropdown(false)
      }}
      onEditImageChange={(e) => {
        const files = Array.from(e.target.files)
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, images: [...taskModalHook.editingTask.images, ...files] })
      }}
      onRemoveEditImage={(index) => {
        const newImages = [...taskModalHook.editingTask.images]
        newImages.splice(index, 1)
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, images: newImages })
      }}
      onRemoveExistingImage={(index) => {
        const newExistingImages = [...taskModalHook.editingTask.existingImages]
        newExistingImages.splice(index, 1)
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, existingImages: newExistingImages })
      }}
      onAttachmentChange={(e) => {
        const files = Array.from(e.target.files)
        taskModalHook.setNewTask({ ...taskModalHook.newTask, attachments: [...taskModalHook.newTask.attachments, ...files] })
      }}
      onRemoveAttachment={(index) => {
        const newAttachments = [...taskModalHook.newTask.attachments]
        newAttachments.splice(index, 1)
        taskModalHook.setNewTask({ ...taskModalHook.newTask, attachments: newAttachments })
      }}
      onEditAttachmentChange={(e) => {
        const files = Array.from(e.target.files)
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, attachments: [...taskModalHook.editingTask.attachments, ...files] })
      }}
      onRemoveEditAttachment={(index) => {
        const newAttachments = [...taskModalHook.editingTask.attachments]
        newAttachments.splice(index, 1)
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, attachments: newAttachments })
      }}
      onRemoveExistingAttachment={(index) => {
        const newExistingAttachments = [...taskModalHook.editingTask.existingAttachments]
        newExistingAttachments.splice(index, 1)
        taskModalHook.setEditingTask({ ...taskModalHook.editingTask, existingAttachments: newExistingAttachments })
      }}
      onOpenAttachment={handleOpenAttachment}
      onEditDrag={taskModalHook.handleDrag}
      onEditDrop={(e) => taskModalHook.handleDrop(e, true)}
      onEditPaste={(e) => taskModalHook.handlePaste(e, true)}
      onConfirmUpdateTask={handleUpdateTask}
      onCloseEditTaskModal={() => taskModalHook.setShowEditTaskModal(false)}
      onConfirmDelete={handleConfirmDelete}
      onCancelDelete={handleCancelDelete}
      onOpenProjectMemoView={handleOpenProjectMemoView}
      onSwitchToEditMode={handleSwitchToEditMode}
      onCloseProjectMemo={handleCloseProjectMemo}
      onProjectMemoChange={(memo) => setEditingProjectMemo({ ...editingProjectMemo, memo })}
      onUpdateProjectMemo={handleUpdateProjectMemo}
      onCloseImagePreview={handleCloseImagePreview}
      onPrevImage={handlePrevImage}
      onNextImage={handleNextImage}
      groupTasksByModule={taskManagerHook.groupTasksByModule}
      onOpenEditTaskModule={handleOpenEditTaskModule}
      onConfirmEditTaskModule={handleConfirmEditTaskModule}
      onCloseEditTaskModule={handleCloseEditTaskModule}
      onOpenEditModuleList={handleOpenEditModuleList}
      onUpdateModuleInList={handleUpdateModuleInList}
      onDeleteModuleInList={handleDeleteModuleInList}
      onPermanentDeleteModuleInList={handlePermanentDeleteModuleInList}
      onRestoreModuleInList={handleRestoreModuleInList}
      onAddModuleInList={handleAddModuleInList}
      onReorderModules={handleReorderModules}
      onCloseEditModuleList={handleCloseEditModuleList}
      shelvedTasks={taskManagerHook.shelvedTasks}
      showShelvedTasks={taskManagerHook.showShelvedTasks}
      onToggleShelvedTasks={() => taskManagerHook.setShowShelvedTasks(!taskManagerHook.showShelvedTasks)}
      onTaskShelve={handleShelveTask}
      onTaskUnshelve={handleUnshelveTask}
      onTaskPin={handlePinTask}
      onTaskUnpin={handleUnpinTask}
      onReorderPendingModules={(oldIndex, newIndex) => taskManagerHook.reorderPendingModules(oldIndex, newIndex, showToast)}
      onCheckItemChange={handleCheckItemChange}
    />
  )
}
