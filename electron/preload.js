const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  versions: process.versions,
  ping: () => ipcRenderer.invoke('ping'),
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    add: (project) => ipcRenderer.invoke('projects:add', project),
    update: (project) => ipcRenderer.invoke('projects:update', project),
    delete: (id) => ipcRenderer.invoke('projects:delete', id),
    reorder: (projectIds) => ipcRenderer.invoke('projects:reorder', projectIds)
  },
  modules: {
    list: (projectId, includeDeleted) => ipcRenderer.invoke('modules:list', projectId, includeDeleted),
    add: (module) => ipcRenderer.invoke('modules:add', module),
    update: (module) => ipcRenderer.invoke('modules:update', module),
    delete: (id) => ipcRenderer.invoke('modules:delete', id),
    restore: (id) => ipcRenderer.invoke('modules:restore', id),
    permanentDelete: (id) => ipcRenderer.invoke('modules:permanentDelete', id),
    reorder: (payload) => ipcRenderer.invoke('modules:reorder', payload)
  },
  tasks: {
    list: (projectId) => ipcRenderer.invoke('tasks:list', projectId),
    add: (task) => ipcRenderer.invoke('tasks:add', task),
    update: (task) => ipcRenderer.invoke('tasks:update', task),
    updateModule: (payload) => ipcRenderer.invoke('tasks:updateModule', payload),
    updateCheckItems: (payload) => ipcRenderer.invoke('tasks:updateCheckItems', payload),
    markDone: (id) => ipcRenderer.invoke('tasks:markDone', id),
    rollback: (id) => ipcRenderer.invoke('tasks:rollback', id),
    shelve: (id) => ipcRenderer.invoke('tasks:shelve', id),
    unshelve: (id) => ipcRenderer.invoke('tasks:unshelve', id),
    delete: (id) => ipcRenderer.invoke('tasks:delete', id),
    todayStats: (projectId) => ipcRenderer.invoke('tasks:todayStats', projectId),
    exportTodayReport: (projectId) => ipcRenderer.invoke('tasks:exportTodayReport', projectId),
    exportPendingTasks: (payload) => ipcRenderer.invoke('tasks:exportPendingTasks', payload)
  },
  // 图片相关
  image: {
    getPath: (imagePath) => ipcRenderer.invoke('image:getPath', imagePath)
  },
  // 配置管理
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    save: (encodedConfig) => ipcRenderer.invoke('config:save', encodedConfig)
  },
  // 数据导入导出
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import')
  },
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },
  // 系统功能
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },
  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion')
  }
})