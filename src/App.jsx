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
  const [showEditProjectModal, setShowEditProjectModal] = useState(false)
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [editingProject, setEditingProject] = useState(null)
  const [projectToDelete, setProjectToDelete] = useState(null)
  
  // 项目备忘相关状态
  const [showProjectMemoModal, setShowProjectMemoModal] = useState(false)
  const [showProjectMemoView, setShowProjectMemoView] = useState(false)
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
    setTaskTypeColors({...colorMap})
  }

  // 加载项目列表
  const loadProjects = async () => {
    const list = await window.electron?.projects?.list()
    setProjects(list || [])
  }

  // 配置变化时刷新
  const handleConfigChange = () => {
    loadConfig()
    // 重新加载搜索范围配置
    if (taskManagerHook.loadSearchScope) {
      taskManagerHook.loadSearchScope()
    }
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

  // 打开编辑项目模态框
  const handleEditProject = (project) => {
    setEditingProject({ ...project })
    setShowEditProjectModal(true)
  }

  // 更新项目
  const handleUpdateProject = async () => {
    if (!editingProject.name.trim()) {
      showToast('请输入项目名称', 'error')
      return
    }

    const result = await window.electron?.projects?.update({
      id: editingProject.id,
      name: editingProject.name
    })

    if (result?.success) {
      setEditingProject(null)
      setShowEditProjectModal(false)
      loadProjects()
      if (currentProject?.id === editingProject.id) {
        setCurrentProject({ ...currentProject, name: editingProject.name })
      }
      showToast('项目更新成功！')
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

  // 打开项目备忘查看
  const handleOpenProjectMemoView = () => {
    setEditingProjectMemo({ 
      id: currentProject.id, 
      name: currentProject.name,
      memo: currentProject.memo || '' 
    })
    setShowProjectMemoView(true)
  }

  // 打开项目备忘编辑
  const handleOpenProjectMemoEdit = () => {
    setShowProjectMemoView(false)
    setShowProjectMemoModal(true)
  }

  // 打开添加项目备忘
  const handleOpenAddProjectMemo = () => {
    setEditingProjectMemo({ 
      id: currentProject.id, 
      name: currentProject.name,
      memo: '' 
    })
    setShowProjectMemoModal(true)
  }

  // 更新项目备忘
  const handleUpdateProjectMemo = async () => {
    const result = await window.electron?.projects?.update({
      id: editingProjectMemo.id,
      memo: editingProjectMemo.memo
    })

    if (result?.success) {
      setShowProjectMemoModal(false)
      setEditingProjectMemo(null)
      loadProjects()
      if (currentProject?.id === editingProjectMemo.id) {
        setCurrentProject({ ...currentProject, memo: editingProjectMemo.memo })
      }
      showToast('备忘更新成功！')
    } else {
      showToast(result?.error || '更新失败', 'error')
    }
  }

  // 关闭项目备忘查看
  const handleCloseProjectMemoView = () => {
    setShowProjectMemoView(false)
    setEditingProjectMemo(null)
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
      codeBlock: taskModalHook.newTask.codeBlock
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
      codeBlock: task.codeBlock ? {
        enabled: task.codeBlock.enabled || false,
        language: task.codeBlock.language || 'javascript',
        code: task.codeBlock.code || ''
      } : {
        enabled: false,
        language: 'javascript',
        code: ''
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
  const handleDeleteModuleInList = async (moduleId) => {
    const result = await window.electron?.modules?.delete(moduleId)

    if (result?.success) {
      showToast('模块删除成功', 'success')
      await taskManagerHook.refreshData()
    } else {
      showToast(result?.error || '模块删除失败', 'error')
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
      codeBlock: taskModalHook.editingTask.codeBlock
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
      showToast(`📊 日报已保存到: ${result.path}`)
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
        showEditProjectModal={showEditProjectModal}
        showDeleteProjectConfirm={showDeleteProjectConfirm}
        showProjectMemoModal={showProjectMemoModal}
        newProjectName={newProjectName}
        editingProject={editingProject}
        projectToDelete={projectToDelete}
        editingProjectMemo={editingProjectMemo}
        onSelectProject={handleSelectProject}
        onAddProject={() => setShowAddProjectModal(true)}
        onEditProject={handleEditProject}
        onDeleteProject={handleOpenDeleteProjectConfirm}
        onProjectNameChange={setNewProjectName}
        onEditProjectNameChange={(name) => setEditingProject({ ...editingProject, name })}
        onCreateProject={handleCreateProject}
        onUpdateProject={handleUpdateProject}
        onConfirmDeleteProject={handleConfirmDeleteProject}
        onCancelDeleteProject={handleCancelDeleteProject}
        onProjectMemoChange={(memo) => setEditingProjectMemo({ ...editingProjectMemo, memo })}
        onUpdateProjectMemo={handleUpdateProjectMemo}
        onCloseProjectMemoModal={() => setShowProjectMemoModal(false)}
        onCloseAddProjectModal={() => setShowAddProjectModal(false)}
        onCloseEditProjectModal={() => setShowEditProjectModal(false)}
        onProjectsReorder={handleProjectsReorder}
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
      searchScope={taskManagerHook.searchScope}
      collapsedModules={taskManagerHook.collapsedModules}
      editingModuleName={taskManagerHook.editingModuleName}
      showAddTaskModal={taskModalHook.showAddTaskModal}
      showEditTaskModal={taskModalHook.showEditTaskModal}
      showDeleteConfirm={showDeleteConfirm}
      showProjectMemoView={showProjectMemoView}
      showProjectMemoModal={showProjectMemoModal}
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
      onEditDrag={taskModalHook.handleDrag}
      onEditDrop={(e) => taskModalHook.handleDrop(e, true)}
      onEditPaste={(e) => taskModalHook.handlePaste(e, true)}
      onConfirmUpdateTask={handleUpdateTask}
      onCloseEditTaskModal={() => taskModalHook.setShowEditTaskModal(false)}
      onConfirmDelete={handleConfirmDelete}
      onCancelDelete={handleCancelDelete}
      onOpenProjectMemoView={handleOpenProjectMemoView}
      onOpenProjectMemoEdit={handleOpenProjectMemoEdit}
      onCloseProjectMemoView={handleCloseProjectMemoView}
      onProjectMemoChange={(memo) => setEditingProjectMemo({ ...editingProjectMemo, memo })}
      onUpdateProjectMemo={handleUpdateProjectMemo}
      onCloseProjectMemoModal={() => setShowProjectMemoModal(false)}
      onOpenAddProjectMemo={handleOpenAddProjectMemo}
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
      onRestoreModuleInList={handleRestoreModuleInList}
      onReorderModules={handleReorderModules}
      onCloseEditModuleList={handleCloseEditModuleList}
    />
  )
}
