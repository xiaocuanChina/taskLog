import { useState, useEffect, useRef } from 'react'
import { getConfig } from '../utils/configManager'

// 任务管理自定义 Hook
export function useTaskManager(currentProject) {
  const [modules, setModules] = useState([])
  const [recycleModules, setRecycleModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [todayStats, setTodayStats] = useState({ count: 0, newCount: 0 })
  const [searchKeyword, setSearchKeyword] = useState('')
  const [collapsedModules, setCollapsedModules] = useState({})
  const [editingModuleName, setEditingModuleName] = useState(null)
  const [selectedModuleFilter, setSelectedModuleFilter] = useState(null) // 模块筛选
  const [completedSearchKeyword, setCompletedSearchKeyword] = useState('')
  const [completedModuleFilter, setCompletedModuleFilter] = useState(null)
  const [showShelvedTasks, setShowShelvedTasks] = useState(false) // 是否显示搁置任务

  // 加载模块列表
  const loadModules = async (projectId) => {
    if (!projectId) return
    const list = await window.electron?.modules?.list(projectId, true)

    const activeModules = []
    const deletedModules = []

    if (list) {
      list.forEach(m => {
        if (m.deleted) {
          deletedModules.push(m)
        } else {
          activeModules.push(m)
        }
      })
    }

    // 按照 order 字段排序，如果没有 order 则按创建时间排序
    const sortedList = activeModules.sort((a, b) => {
      const aOrder = a.order !== undefined ? a.order : 999999
      const bOrder = b.order !== undefined ? b.order : 999999

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      // order 相同时按创建时间排序
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
    setModules(sortedList)
    setRecycleModules(deletedModules)
  }

  // 加载任务列表
  const loadTasks = async (projectId) => {
    if (!projectId) return
    const list = await window.electron?.tasks?.list(projectId)
    setTasks(list || [])
  }

  // 加载今日统计
  const loadStats = async (projectId) => {
    if (!projectId) return
    const stats = await window.electron?.tasks?.todayStats(projectId)
    setTodayStats(stats || { count: 0, newCount: 0 })
  }

  // 刷新所有数据
  const refreshData = async () => {
    if (!currentProject?.id) return
    await Promise.all([
      loadModules(currentProject.id),
      loadTasks(currentProject.id),
      loadStats(currentProject.id)
    ])
  }

  useEffect(() => {
    refreshData()

    // 切换项目时重置所有筛选和搜索状态
    setSearchKeyword('')
    setSelectedModuleFilter(null)
    setCompletedSearchKeyword('')
    setCompletedModuleFilter(null)
    setEditingModuleName(null)
    setCollapsedModules({})
  }, [currentProject?.id])

  // 未完成和已完成任务（排除搁置任务）
  const allPendingTasks = tasks
    .filter(t => !t.completed && !t.shelved)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // 搁置的任务
  const shelvedTasks = tasks
    .filter(t => !t.completed && t.shelved)
    .sort((a, b) => new Date(b.shelvedAt || b.createdAt) - new Date(a.shelvedAt || a.createdAt))

  const pendingTasks = allPendingTasks.filter(t => {
    // 1. 模块筛选
    if (selectedModuleFilter && t.module !== selectedModuleFilter) {
      return false
    }

    // 2. 关键字筛选
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      // 通用搜索（模块 + 描述）
      return t.name.toLowerCase().includes(keyword) ||
        (t.module && t.module.toLowerCase().includes(keyword))
    }

    return true
  })

  const completedTasks = tasks
    .filter(t => t.completed)
    .filter(t => {
      // 1. 模块筛选
      if (completedModuleFilter && t.module !== completedModuleFilter) {
        return false
      }

      // 2. 关键字筛选
      if (completedSearchKeyword.trim()) {
        const keyword = completedSearchKeyword.toLowerCase()
        // 通用搜索（模块 + 描述）
        return t.name.toLowerCase().includes(keyword) ||
          (t.module && t.module.toLowerCase().includes(keyword))
      }

      return true
    })
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))

  // 按模块分组（保持模块的排序顺序）
  const groupTasksByModule = (taskList) => {
    // 先收集所有任务按模块分组
    const tempGrouped = {}
    taskList.forEach(task => {
      const moduleName = task.module || '未分类'
      if (!tempGrouped[moduleName]) {
        tempGrouped[moduleName] = []
      }
      tempGrouped[moduleName].push(task)
    })

    // 按照模块的排序顺序构建数组
    const groupedArray = []

    // 合并 active modules 和 recycle modules，并保持它们的原始顺序
    // 因为 recycle modules 也是有 order 的，所以我们可以将它们合并后统一排序
    // 或者简单地，我们希望保持视觉上的稳定性，可以考虑将它们一起处理

    const allKnownModules = [...modules, ...recycleModules].sort((a, b) => {
      const aOrder = a.order !== undefined ? a.order : 999999
      const bOrder = b.order !== undefined ? b.order : 999999

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      return new Date(a.createdAt) - new Date(b.createdAt)
    })

    // 遍历所有已知模块（包括回收站中的）
    allKnownModules.forEach(module => {
      if (tempGrouped[module.name] && tempGrouped[module.name].length > 0) {
        groupedArray.push({
          moduleName: module.name,
          tasks: tempGrouped[module.name]
        })
      }
    })

    // 再添加未分类或新模块（不在模块列表中的）
    Object.keys(tempGrouped).forEach(moduleName => {
      const alreadyAdded = groupedArray.some(g => g.moduleName === moduleName)
      if (!alreadyAdded) {
        groupedArray.push({
          moduleName: moduleName,
          tasks: tempGrouped[moduleName]
        })
      }
    })


    return groupedArray
  }

  // 切换模块展开/收起状态
  const toggleModuleCollapse = (moduleName, status, forceState) => {
    const key = `${moduleName}-${status}`
    setCollapsedModules(prev => ({
      ...prev,
      [key]: forceState !== undefined ? forceState : !prev[key]
    }))
  }

  // 开始编辑模块名
  const startEditModuleName = (moduleName, status) => {
    setEditingModuleName({ moduleName, status, newName: moduleName })
  }

  // 取消编辑模块名
  const cancelEditModuleName = () => {
    setEditingModuleName(null)
  }

  // 保存模块名
  const saveModuleName = async (showToast) => {
    if (!editingModuleName) return

    const { moduleName, newName } = editingModuleName

    if (!newName.trim()) {
      showToast('模块名称不能为空', 'error')
      return
    }

    if (newName === moduleName) {
      cancelEditModuleName()
      return
    }

    const module = modules.find(m => m.name === moduleName && m.projectId === currentProject.id)
    if (!module) {
      showToast('模块不存在', 'error')
      return
    }

    const result = await window.electron?.modules?.update({
      id: module.id,
      projectId: currentProject.id,
      name: newName.trim()
    })

    if (result?.success) {
      showToast('模块名称修改成功', 'success')
      await refreshData()
      cancelEditModuleName()
    } else {
      showToast(result?.error || '模块名称修改失败', 'error')
    }
  }

  // 重新排序待办模块（拖拽排序）
  const reorderPendingModules = async (oldIndex, newIndex, showToast) => {
    // 获取当前待办任务的模块分组
    const pendingGroups = groupTasksByModule(pendingTasks)
    const moduleNames = pendingGroups.map(g => g.moduleName)

    // 计算新的顺序
    const [movedModule] = moduleNames.splice(oldIndex, 1)
    moduleNames.splice(newIndex, 0, movedModule)

    // 更新模块的 order 字段
    const updatePromises = moduleNames.map(async (moduleName, index) => {
      const module = modules.find(m => m.name === moduleName && m.projectId === currentProject.id)
      if (module) {
        return window.electron?.modules?.update({
          id: module.id,
          projectId: currentProject.id,
          order: index
        })
      }
    })

    await Promise.all(updatePromises)
    await refreshData()
    if (showToast) {
      showToast('模块排序已更新', 'success')
    }
  }

  return {
    modules,
    recycleModules,
    tasks, // 导出所有任务数据
    todayStats,
    searchKeyword,
    setSearchKeyword,
    selectedModuleFilter,
    setSelectedModuleFilter,
    collapsedModules,
    editingModuleName,
    setEditingModuleName,
    pendingTasks,
    completedTasks,
    shelvedTasks,
    showShelvedTasks,
    setShowShelvedTasks,
    completedSearchKeyword,
    setCompletedSearchKeyword,
    completedModuleFilter,
    setCompletedModuleFilter,
    groupTasksByModule,
    toggleModuleCollapse,
    startEditModuleName,
    cancelEditModuleName,
    saveModuleName,
    reorderPendingModules,
    refreshData
  }
}
