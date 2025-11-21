import { useState, useEffect, useRef } from 'react'
import { getConfig } from '../utils/configManager'

// 任务管理自定义 Hook
export function useTaskManager(currentProject) {
  const [modules, setModules] = useState([])
  const [tasks, setTasks] = useState([])
  const [todayStats, setTodayStats] = useState({ count: 0, newCount: 0 })
  const [searchKeyword, setSearchKeyword] = useState('')
  const [collapsedModules, setCollapsedModules] = useState({})
  const [editingModuleName, setEditingModuleName] = useState(null)
  const [searchScope, setSearchScope] = useState('all') // 'module' | 'description' | 'all'

  // 加载模块列表
  const loadModules = async (projectId) => {
    if (!projectId) return
    const list = await window.electron?.modules?.list(projectId)
    // 按照 order 字段排序，如果没有 order 则按创建时间排序
    const sortedList = (list || []).sort((a, b) => {
      const aOrder = a.order !== undefined ? a.order : 999999
      const bOrder = b.order !== undefined ? b.order : 999999
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      
      // order 相同时按创建时间排序
      return new Date(a.createdAt) - new Date(b.createdAt)
    })
    setModules(sortedList)
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

  // 加载搜索范围配置
  const loadSearchScope = async () => {
    const config = await getConfig()
    setSearchScope(config.general?.searchScope || 'all')
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
    loadSearchScope()
    refreshData()
  }, [currentProject])

  // 未完成和已完成任务
  const allPendingTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  
  const pendingTasks = searchKeyword.trim() 
    ? allPendingTasks.filter(t => {
        const keyword = searchKeyword.toLowerCase()
        
        // 根据配置的搜索范围进行过滤
        switch (searchScope) {
          case 'module':
            // 仅搜索模块名称
            return t.module && t.module.toLowerCase().includes(keyword)
          case 'description':
            // 仅搜索任务描述
            return t.name.toLowerCase().includes(keyword)
          case 'all':
          default:
            // 通用搜索（模块 + 描述）
            return t.name.toLowerCase().includes(keyword) ||
                   (t.module && t.module.toLowerCase().includes(keyword))
        }
      })
    : allPendingTasks
  
  const completedTasks = tasks
    .filter(t => t.completed)
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
    
    // 先添加已排序的模块
    modules.forEach(module => {
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

  return {
    modules,
    tasks, // 导出所有任务数据
    todayStats,
    searchKeyword,
    setSearchKeyword,
    searchScope,
    collapsedModules,
    editingModuleName,
    setEditingModuleName,
    pendingTasks,
    completedTasks,
    groupTasksByModule,
    toggleModuleCollapse,
    startEditModuleName,
    cancelEditModuleName,
    saveModuleName,
    refreshData,
    loadSearchScope
  }
}
