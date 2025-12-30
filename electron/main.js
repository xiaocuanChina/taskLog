const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip')

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // 允许加载本地文件（file:// 协议）
    },
    backgroundColor: '#f5f7fb',
    show: false,
    frame: false, // 移除窗口边框和标题栏
    // titleBarStyle: 'default' // 不需要这个配置了
  })

  win.once('ready-to-show', () => {
    win.show()
  })

  // 开发环境加载 Vite 开发服务器,生产环境加载打包后的文件
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools() // 开发时自动打开开发者工具
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function buildMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { label: '新建窗口', click: () => createWindow() },
        { type: 'separator' },
        { label: '关闭', role: 'close' },
        { label: '退出', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '查看',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重新加载', role: 'forceReload' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { label: '切换全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭窗口', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于',
              message: `${app.getName()}\n版本：${app.getVersion()}`
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  // 使用系统用户数据目录存储数据
  const userDataPath = app.getPath('userData')
  const dataDir = path.join(userDataPath, 'tasksData')
  const imagesDir = path.join(dataDir, 'images')
  const tasksFile = path.join(dataDir, 'tasks.json')
  const projectsFile = path.join(dataDir, 'projects.json')
  const modulesFile = path.join(dataDir, 'modules.json')

  function ensureStore() {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.mkdirSync(imagesDir, { recursive: true })
    if (!fs.existsSync(tasksFile)) fs.writeFileSync(tasksFile, '[]', 'utf-8')
    if (!fs.existsSync(projectsFile)) fs.writeFileSync(projectsFile, '[]', 'utf-8')
    if (!fs.existsSync(modulesFile)) fs.writeFileSync(modulesFile, '[]', 'utf-8')
  }

  function readTasks() {
    try {
      ensureStore()
      const raw = fs.readFileSync(tasksFile, 'utf-8')
      return JSON.parse(raw)
    } catch (e) {
      return []
    }
  }

  function writeTasks(list) {
    ensureStore()
    fs.writeFileSync(tasksFile, JSON.stringify(list), 'utf-8')
  }

  function readProjects() {
    try {
      ensureStore()
      const raw = fs.readFileSync(projectsFile, 'utf-8')
      return JSON.parse(raw)
    } catch (e) {
      return []
    }
  }

  function writeProjects(list) {
    ensureStore()
    fs.writeFileSync(projectsFile, JSON.stringify(list), 'utf-8')
  }

  function readModules() {
    try {
      ensureStore()
      const raw = fs.readFileSync(modulesFile, 'utf-8')
      return JSON.parse(raw)
    } catch (e) {
      return []
    }
  }

  function writeModules(list) {
    ensureStore()
    fs.writeFileSync(modulesFile, JSON.stringify(list), 'utf-8')
  }
  function uid() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
  function sameDay(a, b) {
    const da = new Date(a)
    const db = new Date(b)
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
  }
  ipcMain.handle('ping', () => 'pong')

  // 系统功能
  ipcMain.handle('shell:openExternal', (e, url) => {
    return shell.openExternal(url)
  })

  // 项目管理
  ipcMain.handle('projects:list', () => {
    return readProjects()
  })

  ipcMain.handle('projects:add', (e, payload) => {
    const list = readProjects()
    const project = {
      id: uid(),
      name: payload?.name || '',
      memo: payload?.memo || '', // 项目备忘
      createdAt: new Date().toISOString()
    }
    list.push(project)
    writeProjects(list)
    return project
  })

  ipcMain.handle('projects:update', (e, payload) => {
    const list = readProjects()
    const idx = list.findIndex(p => p.id === payload.id)
    if (idx >= 0) {
      list[idx].name = payload?.name || list[idx].name
      if (payload.hasOwnProperty('memo')) {
        list[idx].memo = payload.memo
      }
      list[idx].updatedAt = new Date().toISOString()
      writeProjects(list)
      return { success: true, project: list[idx] }
    }
    return { success: false, error: '项目不存在' }
  })

  ipcMain.handle('projects:delete', (e, id) => {
    const list = readProjects()
    const idx = list.findIndex(p => p.id === id)
    if (idx >= 0) {
      // 检查项目下是否有未完成的任务
      const tasks = readTasks()
      const projectTasks = tasks.filter(t => t.projectId === id)
      const pendingTasks = projectTasks.filter(t => !t.completed)

      if (pendingTasks.length > 0) {
        return { success: false, error: `该项目下还有 ${pendingTasks.length} 个未完成的任务，无法删除` }
      }

      // 删除项目下的所有任务及其图片
      projectTasks.forEach(task => {
        if (task.images && Array.isArray(task.images)) {
          task.images.forEach(imgPath => {
            try {
              const fullPath = path.isAbsolute(imgPath) ? imgPath : path.join(imagesDir, imgPath)
              if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath)
              }
            } catch (err) {
              console.error('删除图片失败:', err)
            }
          })
        }
      })
      // 删除任务数据
      const remainingTasks = tasks.filter(t => t.projectId !== id)
      writeTasks(remainingTasks)

      // 删除项目下的所有模块
      const modules = readModules()
      const remainingModules = modules.filter(m => m.projectId !== id)
      writeModules(remainingModules)

      // 删除项目
      list.splice(idx, 1)
      writeProjects(list)
      return { success: true }
    }
    return { success: false, error: '项目不存在' }
  })

  ipcMain.handle('projects:reorder', (e, projectIds) => {
    const list = readProjects()
    // 根据传入的ID顺序重新排列项目
    const reorderedList = []
    projectIds.forEach(id => {
      const project = list.find(p => p.id === id)
      if (project) {
        reorderedList.push(project)
      }
    })
    // 保存新的顺序
    writeProjects(reorderedList)
    return { success: true }
  })

  // 模块管理
  ipcMain.handle('modules:list', (e, projectId, includeDeleted = false) => {
    const list = readModules()
    return list.filter(m => m.projectId === projectId && (includeDeleted || !m.deleted))
  })

  ipcMain.handle('modules:add', (e, payload) => {
    const list = readModules()
    // 检查该项目下是否已存在同名模块
    const exists = list.find(m => m.projectId === payload.projectId && m.name === payload.name)
    if (exists) {
      // 如果已存在但被删除了，则恢复它（逻辑删除的恢复）
      if (exists.deleted) {
        exists.deleted = false
        exists.updatedAt = new Date().toISOString()
        writeModules(list)
        return exists
      }
      return exists
    }
    const module = {
      id: uid(),
      name: payload?.name || '',
      projectId: payload?.projectId || '',
      deleted: false, // 默认未删除
      createdAt: new Date().toISOString()
    }
    list.push(module)
    writeModules(list)
    return module
  })

  ipcMain.handle('modules:update', (e, payload) => {
    const list = readModules()
    const idx = list.findIndex(m => m.id === payload.id)
    if (idx >= 0) {
      // 检查新名称是否与其他模块冲突（排除自己）
      const exists = list.find(m => m.id !== payload.id && m.projectId === payload.projectId && m.name === payload.name)
      if (exists) {
        return { success: false, error: '该项目下已存在同名模块' }
      }

      const oldName = list[idx].name
      list[idx].name = payload?.name || list[idx].name
      list[idx].updatedAt = new Date().toISOString()
      writeModules(list)

      // 同时更新所有使用该模块的任务
      const tasks = readTasks()
      let updated = false
      tasks.forEach(task => {
        if (task.projectId === payload.projectId && task.module === oldName) {
          task.module = list[idx].name
          updated = true
        }
      })
      if (updated) {
        writeTasks(tasks)
      }

      return { success: true, module: list[idx] }
    }
    return { success: false, error: '模块不存在' }
  })

  ipcMain.handle('modules:delete', (e, id) => {
    const list = readModules()
    const idx = list.findIndex(m => m.id === id)
    if (idx >= 0) {
      const module = list[idx]

      // 检查是否有未完成的任务使用该模块
      const tasks = readTasks()
      const hasPendingTask = tasks.some(task => task.projectId === module.projectId && task.module === module.name && !task.completed)

      if (hasPendingTask) {
        return { success: false, error: '该模块下还有未完成的任务，无法删除' }
      }

      // 逻辑删除：标记为 deleted
      list[idx].deleted = true
      list[idx].updatedAt = new Date().toISOString()
      writeModules(list)
      return { success: true }
    }
    return { success: false, error: '模块不存在' }
  })

  ipcMain.handle('modules:restore', (e, id) => {
    const list = readModules()
    const idx = list.findIndex(m => m.id === id)
    if (idx >= 0) {
      list[idx].deleted = false
      list[idx].updatedAt = new Date().toISOString()
      writeModules(list)
      return { success: true }
    }
    return { success: false, error: '模块不存在' }
  })

  // 永久删除模块
  ipcMain.handle('modules:permanentDelete', (e, id) => {
    const list = readModules()
    const idx = list.findIndex(m => m.id === id)
    if (idx >= 0) {
      const module = list[idx]

      // 检查是否有任务使用该模块（任务总数必须为0才能永久删除）
      const tasks = readTasks()
      const hasTask = tasks.some(task => task.projectId === module.projectId && task.module === module.name)

      if (hasTask) {
        return { success: false, error: '该模块下还有任务，无法永久删除' }
      }

      // 永久删除：从列表中移除
      list.splice(idx, 1)
      writeModules(list)
      return { success: true }
    }
    return { success: false, error: '模块不存在' }
  })

  ipcMain.handle('modules:reorder', (e, payload) => {
    const list = readModules()
    const { projectId, moduleIds } = payload

    // 获取该项目的所有模块
    const projectModules = list.filter(m => m.projectId === projectId)
    const otherModules = list.filter(m => m.projectId !== projectId)

    // 根据传入的ID顺序重新排列模块，并为所有模块设置 order
    const reorderedModules = []
    moduleIds.forEach((id, index) => {
      const module = projectModules.find(m => m.id === id)
      if (module) {
        module.order = index
        module.updatedAt = new Date().toISOString()
        reorderedModules.push(module)
      }
    })

    // 合并其他项目的模块
    const newList = [...otherModules, ...reorderedModules]
    writeModules(newList)
    return { success: true }
  })

  // 任务管理
  ipcMain.handle('tasks:list', (e, projectId) => {
    const list = readTasks()
    if (projectId) {
      return list.filter(t => t.projectId === projectId)
    }
    return list
  })

  ipcMain.handle('tasks:add', (e, payload) => {
    const list = readTasks()
    const id = uid()
    const images = Array.isArray(payload?.images) ? payload.images : []
    const saved = []
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const ext = path.extname(img?.name || '')
      const fname = `${id}-${i}${ext || ''}`
      const fpath = path.join(imagesDir, fname)
      let buf
      if (Buffer.isBuffer(img?.buffer)) buf = img.buffer
      else if (img?.buffer instanceof Uint8Array) buf = Buffer.from(img.buffer)
      else if (img?.buffer && img.buffer.byteLength) buf = Buffer.from(new Uint8Array(img.buffer))
      if (buf) fs.writeFileSync(fpath, buf)
      saved.push(fname)
    }
    const task = {
      id,
      projectId: payload?.projectId || '',
      module: payload?.module || '',
      name: payload?.name || '',
      type: payload?.type || '',
      initiator: payload?.initiator || '',
      remark: payload?.remark || '',
      images: saved,
      codeBlock: payload?.codeBlock || { enabled: false, language: 'javascript', code: '' },
      checkItems: payload?.checkItems || { enabled: false, mode: 'multiple', items: [] },
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    }
    list.push(task)
    writeTasks(list)
    return task
  })

  ipcMain.handle('tasks:update', (e, payload) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === payload.id)
    if (idx >= 0) {
      // 保留已有图片
      const existingImages = Array.isArray(payload?.existingImages) ? payload.existingImages : []

      // 处理新上传的图片
      const newImages = Array.isArray(payload?.images) ? payload.images : []
      const saved = []
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i]
        const ext = path.extname(img?.name || '')
        const fname = `${payload.id}-${Date.now()}-${i}${ext || ''}`
        const fpath = path.join(imagesDir, fname)
        let buf
        if (Buffer.isBuffer(img?.buffer)) buf = img.buffer
        else if (img?.buffer instanceof Uint8Array) buf = Buffer.from(img.buffer)
        else if (img?.buffer && img.buffer.byteLength) buf = Buffer.from(new Uint8Array(img.buffer))
        if (buf) fs.writeFileSync(fpath, buf)
        saved.push(fname)
      }

      // 删除被移除的旧图片文件
      const oldImages = list[idx].images || []
      oldImages.forEach(oldPath => {
        if (!existingImages.includes(oldPath)) {
          try {
            const fullPath = path.isAbsolute(oldPath) ? oldPath : path.join(imagesDir, oldPath)
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath)
            }
          } catch (err) {
            console.error('删除图片失败:', err)
          }
        }
      })

      // 更新任务信息
      list[idx].module = payload?.module || list[idx].module
      list[idx].name = payload?.name || list[idx].name
      list[idx].type = payload?.type !== undefined ? payload.type : list[idx].type
      list[idx].initiator = payload?.initiator || list[idx].initiator
      list[idx].remark = payload?.remark || ''
      list[idx].images = [...existingImages, ...saved]
      list[idx].codeBlock = payload?.codeBlock || list[idx].codeBlock || { enabled: false, language: 'javascript', code: '' }
      list[idx].checkItems = payload?.checkItems || list[idx].checkItems
      list[idx].updatedAt = new Date().toISOString()

      writeTasks(list)
      return list[idx]
    }
    return null
  })

  ipcMain.handle('tasks:markDone', (e, id) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === id)
    if (idx >= 0) {
      list[idx].completed = true
      list[idx].completedAt = new Date().toISOString()
      writeTasks(list)
      return list[idx]
    }
    return null
  })

  // 更新任务勾选项
  ipcMain.handle('tasks:updateCheckItems', (e, payload) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === payload.taskId)
    if (idx >= 0) {
      list[idx].checkItems = {
        ...list[idx].checkItems,
        items: payload.checkItems
      }
      list[idx].updatedAt = new Date().toISOString()
      writeTasks(list)
      return { success: true, task: list[idx] }
    }
    return { success: false, error: '任务不存在' }
  })

  // 回滚任务状态（将已完成改为待办）
  ipcMain.handle('tasks:rollback', (e, id) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === id)
    if (idx >= 0) {
      list[idx].completed = false
      list[idx].completedAt = null
      writeTasks(list)
      return list[idx]
    }
    return null
  })

  // 搁置任务
  ipcMain.handle('tasks:shelve', (e, id) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === id)
    if (idx >= 0) {
      list[idx].shelved = true
      list[idx].shelvedAt = new Date().toISOString()
      writeTasks(list)
      return list[idx]
    }
    return null
  })

  // 取消搁置任务
  ipcMain.handle('tasks:unshelve', (e, id) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === id)
    if (idx >= 0) {
      list[idx].shelved = false
      list[idx].shelvedAt = null
      writeTasks(list)
      return list[idx]
    }
    return null
  })

  ipcMain.handle('tasks:updateModule', (e, payload) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === payload.id)
    if (idx >= 0) {
      list[idx].module = payload.module
      list[idx].updatedAt = new Date().toISOString()
      writeTasks(list)
      return { success: true, task: list[idx] }
    }
    return { success: false, error: '任务不存在' }
  })

  ipcMain.handle('tasks:delete', (e, id) => {
    const list = readTasks()
    const idx = list.findIndex(x => x.id === id)
    if (idx >= 0) {
      const task = list[idx]
      // 删除关联的图片文件
      if (task.images && Array.isArray(task.images)) {
        task.images.forEach(imgPath => {
          try {
            const fullPath = path.isAbsolute(imgPath) ? imgPath : path.join(imagesDir, imgPath)
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath)
            }
          } catch (err) {
            console.error('删除图片失败:', err)
          }
        })
      }
      // 从列表中移除任务
      list.splice(idx, 1)
      writeTasks(list)
      return { success: true }
    }
    return { success: false }
  })
  ipcMain.handle('tasks:todayStats', (e, projectId) => {
    const list = readTasks()
    const now = new Date()
    let todayDone = list.filter(x => x.completed && x.completedAt && sameDay(x.completedAt, now))
    let todayNew = list.filter(x => x.createdAt && sameDay(x.createdAt, now))
    if (projectId) {
      todayDone = todayDone.filter(x => x.projectId === projectId)
      todayNew = todayNew.filter(x => x.projectId === projectId)
    }
    return { count: todayDone.length, newCount: todayNew.length }
  })

  // 导出今日日报
  ipcMain.handle('tasks:exportTodayReport', async (e, projectId) => {
    const list = readTasks()
    const now = new Date()
    let todayTasks = list.filter(x => x.completed && x.completedAt && sameDay(x.completedAt, now))

    if (projectId) {
      todayTasks = todayTasks.filter(x => x.projectId === projectId)
    }

    // 获取项目名称
    const projects = readProjects()
    const project = projects.find(p => p.id === projectId)
    const projectName = project ? project.name : '所有项目'

    // 构建Markdown内容
    let mdContent = `# 今日日报\n\n`
    mdContent += `**项目**: ${projectName}\n\n`
    mdContent += `**日期**: ${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日\n\n`
    mdContent += `**完成任务数**: ${todayTasks.length}\n\n`
    mdContent += `---\n\n`

    if (todayTasks.length === 0) {
      mdContent += `今日暂无完成的任务。\n`
    } else {
      // 按模块分组
      const tasksByModule = {}
      todayTasks.forEach(task => {
        const moduleName = task.module || '未分类'
        if (!tasksByModule[moduleName]) {
          tasksByModule[moduleName] = []
        }
        tasksByModule[moduleName].push(task)
      })

      // 输出每个模块的任务
      Object.keys(tasksByModule).forEach(moduleName => {
        mdContent += `## ${moduleName}\n\n`

        tasksByModule[moduleName].forEach((task, index) => {
          mdContent += `### ${index + 1}. ${task.name}\n\n`

          if (task.initiator) {
            mdContent += `- **发起人**: ${task.initiator}\n`
          }

          if (task.remark) {
            mdContent += `- **备注**: ${task.remark}\n`
          }

          mdContent += `- **完成时间**: ${new Date(task.completedAt).toLocaleString('zh-CN')}\n`

          // 如果有代码块
          if (task.codeBlock && task.codeBlock.enabled && task.codeBlock.code) {
            mdContent += `\n**代码**:\n\n`
            mdContent += `\`\`\`${task.codeBlock.language || 'text'}\n`
            mdContent += `${task.codeBlock.code}\n`
            mdContent += `\`\`\`\n`
          }

          mdContent += `\n`
        })

        mdContent += `\n`
      })
    }

    // 弹出保存对话框
    const { filePath } = await dialog.showSaveDialog({
      title: '保存今日日报',
      defaultPath: `今日日报_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.md`,
      filters: [
        { name: 'Markdown文件', extensions: ['md'] }
      ]
    })

    if (filePath) {
      fs.writeFileSync(filePath, mdContent, 'utf-8')
      return { success: true, path: filePath }
    }

    return { success: false }
  })

  // 导出未完成任务
  ipcMain.handle('tasks:exportPendingTasks', async (e, payload) => {
    const { projectId, modules: selectedModules, format = 'excel', taskIds = [] } = payload
    const list = readTasks()

    // 筛选未完成的任务
    let pendingTasks = list.filter(x => !x.completed && x.projectId === projectId)

    // 如果传入了任务ID列表，优先按任务ID过滤
    if (taskIds && taskIds.length > 0) {
      pendingTasks = pendingTasks.filter(x => taskIds.includes(x.id))
    } else if (selectedModules && selectedModules.length > 0) {
      // 否则按模块筛选
      pendingTasks = pendingTasks.filter(x => selectedModules.includes(x.module))
    }

    // 获取项目名称
    const projects = readProjects()
    const project = projects.find(p => p.id === projectId)
    const projectName = project ? project.name : '所有项目'

    const now = new Date()
    const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`

    if (format === 'excel') {
      // 导出为Excel格式（使用exceljs支持单元格样式）
      const ExcelJS = require('exceljs')

      // 按模块分组
      const tasksByModule = {}
      pendingTasks.forEach(task => {
        const moduleName = task.module || '未分类'
        if (!tasksByModule[moduleName]) {
          tasksByModule[moduleName] = []
        }
        tasksByModule[moduleName].push(task)
      })

      // 创建工作簿和工作表
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('未完成任务')

      // 设置列宽
      worksheet.columns = [
        { key: 'module', width: 15 },      // 模块
        { key: 'name', width: 40 },        // 任务描述
        { key: 'type', width: 10 },        // 类型
        { key: 'initiator', width: 12 },   // 发起人
        { key: 'remark', width: 30 },      // 备注
        { key: 'createdAt', width: 20 }    // 创建时间
      ]

      // 添加标题信息
      worksheet.addRow(['未完成任务清单'])
      worksheet.addRow([`项目: ${projectName}`])
      worksheet.addRow([`导出时间: ${now.toLocaleString('zh-CN')}`])
      worksheet.addRow([`未完成任务数: ${pendingTasks.length}`])
      worksheet.addRow([]) // 空行

      // 添加表头
      const headerRow = worksheet.addRow(['模块', '任务描述', '类型', '发起人', '备注', '创建时间'])
      // 设置表头样式
      headerRow.eachCell(cell => {
        cell.font = { bold: true }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
      })

      // 记录合并范围信息
      const mergeRanges = []
      const dataStartRow = 7 // 数据从第7行开始
      let currentRowNum = dataStartRow

      // 添加任务数据
      Object.keys(tasksByModule).forEach(moduleName => {
        const tasks = tasksByModule[moduleName]
        const startRowNum = currentRowNum

        tasks.forEach((task, idx) => {
          const row = worksheet.addRow([
            idx === 0 ? moduleName : '', // 只在第一行显示模块名
            task.name,
            task.type || '',
            task.initiator || '',
            task.remark || '',
            new Date(task.createdAt).toLocaleString('zh-CN')
          ])

          // 设置任务描述列（第2列）自动换行
          row.getCell(2).alignment = { wrapText: true, vertical: 'middle' }
          // 设置备注列（第5列）自动换行
          row.getCell(5).alignment = { wrapText: true, vertical: 'middle' }
          // 设置模块列（第1列）水平垂直居中
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
          // 设置其他列垂直居中
          row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
          row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' }
          row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' }

          currentRowNum++
        })

        // 如果该模块有多个任务，记录需要合并的范围
        if (tasks.length > 1) {
          mergeRanges.push({
            startRow: startRowNum,
            endRow: currentRowNum - 1
          })
        }
      })

      // 执行模块列合并
      mergeRanges.forEach(range => {
        worksheet.mergeCells(range.startRow, 1, range.endRow, 1)
        // 合并后的单元格设置居中
        const mergedCell = worksheet.getCell(range.startRow, 1)
        mergedCell.alignment = { horizontal: 'center', vertical: 'middle' }
      })

      // 弹出保存对话框
      const { filePath } = await dialog.showSaveDialog({
        title: '保存未完成任务清单',
        defaultPath: `未完成任务_${projectName}_${dateStr}.xlsx`,
        filters: [
          { name: 'Excel文件', extensions: ['xlsx'] }
        ]
      })

      if (filePath) {
        await workbook.xlsx.writeFile(filePath)
        return { success: true, path: filePath }
      }

      return { success: false }
    } else {
      // 导出为Markdown格式
      let mdContent = `# 未完成任务清单\n\n`
      mdContent += `**项目**: ${projectName}\n\n`
      mdContent += `**导出时间**: ${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}\n\n`
      mdContent += `**未完成任务数**: ${pendingTasks.length}\n\n`
      mdContent += `---\n\n`

      if (pendingTasks.length === 0) {
        mdContent += `暂无未完成的任务。\n`
      } else {
        // 按模块分组
        const tasksByModule = {}
        pendingTasks.forEach(task => {
          const moduleName = task.module || '未分类'
          if (!tasksByModule[moduleName]) {
            tasksByModule[moduleName] = []
          }
          tasksByModule[moduleName].push(task)
        })

        // 输出每个模块的任务
        Object.keys(tasksByModule).forEach(moduleName => {
          mdContent += `## ${moduleName}\n\n`

          tasksByModule[moduleName].forEach((task, index) => {
            mdContent += `### ${index + 1}. ${task.name}\n\n`

            if (task.type) {
              mdContent += `- **类型**: ${task.type}\n`
            }

            if (task.initiator) {
              mdContent += `- **发起人**: ${task.initiator}\n`
            }

            if (task.remark) {
              mdContent += `- **备注**: ${task.remark}\n`
            }

            mdContent += `- **创建时间**: ${new Date(task.createdAt).toLocaleString('zh-CN')}\n`

            // 如果有代码块
            if (task.codeBlock && task.codeBlock.enabled && task.codeBlock.code) {
              mdContent += `\n**代码**:\n\n`
              mdContent += `\`\`\`${task.codeBlock.language || 'text'}\n`
              mdContent += `${task.codeBlock.code}\n`
              mdContent += `\`\`\`\n`
            }

            mdContent += `\n`
          })

          mdContent += `\n`
        })
      }

      // 弹出保存对话框
      const { filePath } = await dialog.showSaveDialog({
        title: '保存未完成任务清单',
        defaultPath: `未完成任务_${projectName}_${dateStr}.md`,
        filters: [
          { name: 'Markdown文件', extensions: ['md'] }
        ]
      })

      if (filePath) {
        fs.writeFileSync(filePath, mdContent, 'utf-8')
        return { success: true, path: filePath }
      }

      return { success: false }
    }
  })

  // 获取图片的本地路径（用于在渲染进程中显示）
  ipcMain.handle('image:getPath', (e, imagePath) => {
    // 返回绝对路径
    if (path.isAbsolute(imagePath)) {
      return imagePath
    }
    return path.join(imagesDir, imagePath)
  })

  // 配置管理
  const configFile = path.join(dataDir, 'config.json')
  const legacyConfigFile = path.join(dataDir, '.config')

  // 默认配置
  const defaultConfig = {
    general: {
      searchScope: 'all',
      themeColors: {
        startColor: '#667eea',
        endColor: '#764ba2'
      }
    },
    taskTypes: [
      { name: 'BUG', color: '#ff4d4f' },
      { name: '代办', color: '#1890ff' },
      { name: '优化', color: '#52c41a' },
      { name: '其他', color: '#463e2e' }
    ]
  }

  // 迁移旧配置到新格式
  function migrateConfig() {
    if (fs.existsSync(legacyConfigFile) && !fs.existsSync(configFile)) {
      try {
        const base64Content = fs.readFileSync(legacyConfigFile, 'utf-8')
        const jsonContent = Buffer.from(base64Content, 'base64').toString('utf-8')
        fs.writeFileSync(configFile, jsonContent, 'utf-8')
        console.log('配置已从旧格式迁移到新格式')
      } catch (error) {
        console.error('迁移配置失败:', error)
      }
    }
  }

  ipcMain.handle('config:get', () => {
    try {
      ensureStore()
      migrateConfig()

      // 优先读取环境变量配置
      if (process.env.TASK_TYPES_CONFIG) {
        try {
          return process.env.TASK_TYPES_CONFIG
        } catch (error) {
          console.error('解析环境变量配置失败:', error)
        }
      }

      // 读取配置文件
      if (fs.existsSync(configFile)) {
        return fs.readFileSync(configFile, 'utf-8')
      }

      // 返回默认配置
      return JSON.stringify(defaultConfig)
    } catch (error) {
      console.error('读取配置失败:', error)
      return JSON.stringify(defaultConfig)
    }
  })

  ipcMain.handle('config:save', (e, configContent) => {
    try {
      ensureStore()
      // 验证是否为有效的JSON
      JSON.parse(configContent)
      fs.writeFileSync(configFile, configContent, 'utf-8')
      return true
    } catch (error) {
      console.error('保存配置失败:', error)
      return false
    }
  })

  // 数据导出
  ipcMain.handle('data:export', async () => {
    try {
      const exportData = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        config: JSON.parse(fs.existsSync(configFile) ? fs.readFileSync(configFile, 'utf-8') : JSON.stringify(defaultConfig)),
        projects: readProjects(),
        modules: readModules(),
        tasks: readTasks()
      }

      const zip = new AdmZip()
      // 添加数据文件
      zip.addFile('data.json', Buffer.from(JSON.stringify(exportData, null, 2), 'utf8'))

      // 添加图片文件夹
      if (fs.existsSync(imagesDir)) {
        zip.addLocalFolder(imagesDir, 'images')
      }

      const { filePath } = await dialog.showSaveDialog({
        title: '导出数据',
        defaultPath: `TaskLog_备份_${new Date().toISOString().split('T')[0]}.zip`,
        filters: [
          { name: '压缩文件', extensions: ['zip'] }
        ]
      })

      if (filePath) {
        zip.writeZip(filePath)
        return { success: true, path: filePath }
      }

      return { success: false }
    } catch (error) {
      console.error('导出数据失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 数据导入
  ipcMain.handle('data:import', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: '导入数据',
        filters: [
          { name: '压缩文件', extensions: ['zip'] },
          { name: 'JSON文件', extensions: ['json'] }
        ],
        properties: ['openFile']
      })

      if (filePaths && filePaths.length > 0) {
        const filePath = filePaths[0]
        const ext = path.extname(filePath).toLowerCase()
        let importData

        if (ext === '.zip') {
          const zip = new AdmZip(filePath)
          const zipEntries = zip.getEntries()

          // 读取 data.json
          const dataEntry = zipEntries.find(entry => entry.entryName === 'data.json')
          if (!dataEntry) {
            return { success: false, error: '无效的备份文件：找不到 data.json' }
          }
          importData = JSON.parse(dataEntry.getData().toString('utf8'))

          // 恢复图片
          // 解压 images 文件夹到 tasksData 目录
          zip.extractAllTo(dataDir, true)
        } else {
          // 兼容旧版 JSON 导入
          importData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        }

        // 验证数据格式
        if (!importData.version || !importData.config || !importData.projects || !importData.modules || !importData.tasks) {
          return { success: false, error: '数据格式不正确' }
        }

        // 保存配置
        fs.writeFileSync(configFile, JSON.stringify(importData.config), 'utf-8')

        // 保存项目
        writeProjects(importData.projects)

        // 保存模块
        writeModules(importData.modules)

        // 保存任务
        writeTasks(importData.tasks)

        return { success: true }
      }

      return { success: false }
    } catch (error) {
      console.error('导入数据失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 窗口控制
  ipcMain.on('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.minimize()
  })
  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })
  ipcMain.on('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) win.close()
  })

  buildMenu() // 恢复菜单栏，可以通过"查看 -> 开发者工具"打开控制台
  // Menu.setApplicationMenu(null) // 设置为 null 移除默认菜单
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})