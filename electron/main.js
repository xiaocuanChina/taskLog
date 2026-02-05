const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip')
const { execFile } = require('child_process')
const Database = require('./database')

// 将 db 定义为全局变量，以便在应用关闭时访问
let db = null

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

app.whenReady().then(async () => {
  // 使用系统用户数据目录存储数据
  const userDataPath = app.getPath('userData')
  const dataDir = path.join(userDataPath, 'tasksData')
  const imagesDir = path.join(dataDir, 'images')
  const dbFile = path.join(dataDir, 'tasklog.db')
  
  // 旧的 JSON 文件路径（用于数据迁移）
  const tasksFile = path.join(dataDir, 'tasks.json')
  const projectsFile = path.join(dataDir, 'projects.json')
  const modulesFile = path.join(dataDir, 'modules.json')

  // 确保目录存在
  fs.mkdirSync(dataDir, { recursive: true })
  fs.mkdirSync(imagesDir, { recursive: true })

  // 初始化数据库
  db = new Database(dbFile)
  await db.init()

  // 数据迁移：如果存在旧的 JSON 文件，迁移到数据库
  if (fs.existsSync(tasksFile) || fs.existsSync(projectsFile) || fs.existsSync(modulesFile)) {
    console.log('检测到旧数据文件，开始迁移到数据库...')
    try {
      const jsonData = {
        projects: fs.existsSync(projectsFile) ? JSON.parse(fs.readFileSync(projectsFile, 'utf-8')) : [],
        modules: fs.existsSync(modulesFile) ? JSON.parse(fs.readFileSync(modulesFile, 'utf-8')) : [],
        tasks: fs.existsSync(tasksFile) ? JSON.parse(fs.readFileSync(tasksFile, 'utf-8')) : []
      }

      // 只有当数据库中没有数据时才迁移
      const existingProjects = db.getProjects()
      if (existingProjects.length === 0) {
        db.migrateFromJSON(jsonData)
        console.log('数据迁移完成')

        // 备份旧文件
        if (fs.existsSync(tasksFile)) fs.renameSync(tasksFile, tasksFile + '.backup')
        if (fs.existsSync(projectsFile)) fs.renameSync(projectsFile, projectsFile + '.backup')
        if (fs.existsSync(modulesFile)) fs.renameSync(modulesFile, modulesFile + '.backup')
        console.log('旧数据文件已备份')
      }
    } catch (error) {
      console.error('数据迁移失败:', error)
    }
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

  // 应用信息
  ipcMain.handle('app:getVersion', () => app.getVersion())

  // 系统功能
  ipcMain.handle('shell:openExternal', (e, url) => {
    return shell.openExternal(url)
  })

  // 项目管理
  ipcMain.handle('projects:list', () => {
    return db.getProjects()
  })

  ipcMain.handle('projects:add', (e, payload) => {
    const project = {
      id: uid(),
      name: payload?.name || '',
      memo: payload?.memo || '',
      createdAt: new Date().toISOString()
    }
    return db.addProject(project)
  })

  ipcMain.handle('projects:update', (e, payload) => {
    const updates = {
      updatedAt: new Date().toISOString()
    }
    if (payload.name !== undefined) updates.name = payload.name
    if (payload.hasOwnProperty('memo')) updates.memo = payload.memo

    const success = db.updateProject(payload.id, updates)
    if (success) {
      const projects = db.getProjects()
      const project = projects.find(p => p.id === payload.id)
      return { success: true, project }
    }
    return { success: false, error: '项目不存在' }
  })

  ipcMain.handle('projects:delete', (e, id) => {
    // 检查项目下是否有未完成的任务
    const tasks = db.getTasks(id)
    const pendingTasks = tasks.filter(t => !t.completed)

    if (pendingTasks.length > 0) {
      return { success: false, error: `该项目下还有 ${pendingTasks.length} 个未完成的任务，无法删除` }
    }

    // 删除项目下的所有任务的图片
    tasks.forEach(task => {
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

    // 删除项目（会级联删除模块和任务）
    db.deleteProject(id)
    return { success: true }
  })

  ipcMain.handle('projects:reorder', (e, projectIds) => {
    // 数据库版本暂时不支持排序，前端可以自行处理
    return { success: true }
  })

  // 模块管理
  ipcMain.handle('modules:list', (e, projectId, includeDeleted = false) => {
    return db.getModules(projectId, includeDeleted)
  })

  ipcMain.handle('modules:add', (e, payload) => {
    // 检查该项目下是否已存在同名模块
    const exists = db.moduleExists(payload.projectId, payload.name)
    if (exists) {
      // 如果已存在但被删除了，则恢复它
      const modules = db.getModules(payload.projectId, true)
      const existingModule = modules.find(m => m.name === payload.name)
      if (existingModule && existingModule.deleted === 1) {
        db.restoreModule(existingModule.id)
        return db.getModuleById(existingModule.id)
      }
      return existingModule
    }

    const module = {
      id: uid(),
      name: payload?.name || '',
      projectId: payload?.projectId || '',
      deleted: false,
      createdAt: new Date().toISOString()
    }
    return db.addModule(module)
  })

  ipcMain.handle('modules:update', (e, payload) => {
    const module = db.getModuleById(payload.id)
    if (!module) {
      return { success: false, error: '模块不存在' }
    }

    // 检查新名称是否与其他模块冲突（排除自己）
    if (payload.name && payload.name !== module.name) {
      const exists = db.moduleExists(payload.projectId, payload.name, payload.id)
      if (exists) {
        return { success: false, error: '该项目下已存在同名模块' }
      }
    }

    const oldName = module.name
    const updates = {
      updatedAt: new Date().toISOString()
    }
    if (payload.name !== undefined) updates.name = payload.name
    if (payload.order !== undefined) updates.order = payload.order

    db.updateModule(payload.id, updates)

    // 如果模块名称改变了，同时更新所有使用该模块的任务
    if (payload.name && payload.name !== oldName) {
      db.updateTasksModule(payload.projectId, oldName, payload.name)
    }

    return { success: true, module: db.getModuleById(payload.id) }
  })

  ipcMain.handle('modules:delete', (e, id) => {
    const module = db.getModuleById(id)
    if (!module) {
      return { success: false, error: '模块不存在' }
    }

    // 检查是否有未完成的任务使用该模块
    const pendingCount = db.getPendingTaskCountByModule(module.projectId, module.name)
    if (pendingCount > 0) {
      return { success: false, error: '该模块下还有未完成的任务，无法删除' }
    }

    // 逻辑删除
    db.deleteModule(id)
    return { success: true }
  })

  ipcMain.handle('modules:restore', (e, id) => {
    const module = db.getModuleById(id)
    if (!module) {
      return { success: false, error: '模块不存在' }
    }
    db.restoreModule(id)
    return { success: true }
  })

  // 永久删除模块
  ipcMain.handle('modules:permanentDelete', (e, id) => {
    const module = db.getModuleById(id)
    if (!module) {
      return { success: false, error: '模块不存在' }
    }

    // 检查是否有任务使用该模块
    const taskCount = db.getTaskCountByModule(module.projectId, module.name)
    if (taskCount > 0) {
      return { success: false, error: '该模块下还有任务，无法永久删除' }
    }

    db.permanentDeleteModule(id)
    return { success: true }
  })

  ipcMain.handle('modules:reorder', (e, payload) => {
    const { moduleIds } = payload

    // 为所有模块设置 order
    moduleIds.forEach((id, index) => {
      db.updateModule(id, { 
        order: index,
        updatedAt: new Date().toISOString()
      })
    })

    return { success: true }
  })

  // 任务管理
  ipcMain.handle('tasks:list', (e, projectId) => {
    if (projectId) {
      return db.getTasks(projectId)
    }
    return []
  })

  ipcMain.handle('tasks:add', (e, payload) => {
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
      shelved: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      shelvedAt: null
    }
    
    return db.addTask(task)
  })

  ipcMain.handle('tasks:update', (e, payload) => {
    const task = db.getTaskById(payload.id)
    if (!task) return null

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
    const oldImages = task.images || []
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
    const updates = {
      updatedAt: new Date().toISOString()
    }
    if (payload.module !== undefined) updates.module = payload.module
    if (payload.name !== undefined) updates.name = payload.name
    if (payload.type !== undefined) updates.type = payload.type
    if (payload.initiator !== undefined) updates.initiator = payload.initiator
    if (payload.remark !== undefined) updates.remark = payload.remark
    updates.images = [...existingImages, ...saved]
    if (payload.codeBlock !== undefined) updates.codeBlock = payload.codeBlock
    if (payload.checkItems !== undefined) updates.checkItems = payload.checkItems

    return db.updateTask(payload.id, updates)
  })

  ipcMain.handle('tasks:markDone', (e, id) => {
    const task = db.getTaskById(id)
    if (!task) return null

    const updates = {
      completed: true,
      completedAt: new Date().toISOString()
    }

    // 保存完成前的勾选状态（用于回滚时还原）
    if (task.checkItems?.enabled && task.checkItems?.items?.length > 0) {
      updates.checkItemsBeforeComplete = task.checkItems.items.map(item => ({
        id: item.id,
        checked: item.checked
      }))
      // 将所有勾选项设为已勾选
      updates.checkItems = {
        ...task.checkItems,
        items: task.checkItems.items.map(item => ({
          ...item,
          checked: true
        }))
      }
    }

    return db.updateTask(id, updates)
  })

  // 更新任务勾选项
  ipcMain.handle('tasks:updateCheckItems', (e, payload) => {
    const updates = {
      checkItems: {
        enabled: true,
        items: payload.checkItems
      },
      updatedAt: new Date().toISOString()
    }
    const task = db.updateTask(payload.taskId, updates)
    if (task) {
      return { success: true, task }
    }
    return { success: false, error: '任务不存在' }
  })

  // 回滚任务状态（将已完成改为待办）
  ipcMain.handle('tasks:rollback', (e, id) => {
    const task = db.getTaskById(id)
    if (!task) return null

    const updates = {
      completed: false,
      completedAt: null
    }

    // 恢复完成前的勾选状态
    if (task.checkItemsBeforeComplete && task.checkItems?.items?.length > 0) {
      const beforeState = task.checkItemsBeforeComplete
      updates.checkItems = {
        ...task.checkItems,
        items: task.checkItems.items.map(item => {
          const savedState = beforeState.find(s => s.id === item.id)
          return {
            ...item,
            checked: savedState ? savedState.checked : false
          }
        })
      }
      updates.checkItemsBeforeComplete = null
    }

    return db.updateTask(id, updates)
  })

  // 搁置任务
  ipcMain.handle('tasks:shelve', (e, id) => {
    const updates = {
      shelved: true,
      shelvedAt: new Date().toISOString()
    }
    return db.updateTask(id, updates)
  })

  // 取消搁置任务
  ipcMain.handle('tasks:unshelve', (e, id) => {
    const updates = {
      shelved: false,
      shelvedAt: null
    }
    return db.updateTask(id, updates)
  })

  ipcMain.handle('tasks:updateModule', (e, payload) => {
    const updates = {
      module: payload.module,
      updatedAt: new Date().toISOString()
    }
    const task = db.updateTask(payload.id, updates)
    if (task) {
      return { success: true, task }
    }
    return { success: false, error: '任务不存在' }
  })

  ipcMain.handle('tasks:delete', (e, id) => {
    const task = db.getTaskById(id)
    if (!task) {
      return { success: false }
    }

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

    db.deleteTask(id)
    return { success: true }
  })
  ipcMain.handle('tasks:todayStats', (e, projectId) => {
    if (!projectId) return { count: 0, newCount: 0 }
    
    const tasks = db.getTasks(projectId)
    const now = new Date()
    
    const todayDone = tasks.filter(x => x.completed && x.completedAt && sameDay(x.completedAt, now))
    const todayNew = tasks.filter(x => x.createdAt && sameDay(x.createdAt, now))
    
    return { count: todayDone.length, newCount: todayNew.length }
  })

  // 导出今日日报
  ipcMain.handle('tasks:exportTodayReport', async (e, projectId) => {
    const tasks = db.getTasks(projectId)
    const now = new Date()
    const todayTasks = tasks.filter(x => x.completed && x.completedAt && sameDay(x.completedAt, now))

    // 获取项目名称
    const projects = db.getProjects()
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
    const tasks = db.getTasks(projectId)

    // 筛选未完成的任务
    let pendingTasks = tasks.filter(x => !x.completed)

    // 如果传入了任务ID列表，优先按任务ID过滤
    if (taskIds && taskIds.length > 0) {
      pendingTasks = pendingTasks.filter(x => taskIds.includes(x.id))
    } else if (selectedModules && selectedModules.length > 0) {
      // 否则按模块筛选
      pendingTasks = pendingTasks.filter(x => selectedModules.includes(x.module))
    }

    // 获取项目名称
    const projects = db.getProjects()
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

  // 剪贴板文件写入（支持多文件）
  ipcMain.handle('clipboard:writeFiles', (e, filePaths) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0) return false
    
    // 目前仅支持 Windows
    if (process.platform === 'win32') {
      return new Promise((resolve) => {
        // 构建 PowerShell 命令
        // 使用单引号包裹路径，并转义单引号 (两个单引号)
        const paths = filePaths.map(p => `'${p.replace(/'/g, "''")}'`).join(',')
        const psCommand = `Set-Clipboard -Path ${paths}`
        
        execFile('powershell', ['-Command', psCommand], (error) => {
          if (error) {
            console.error('Failed to copy files to clipboard:', error)
            resolve(false)
          } else {
            resolve(true)
          }
        })
      })
    }
    return false
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
  function migrateOldConfig() {
    if (fs.existsSync(legacyConfigFile) && !fs.existsSync(configFile)) {
      try {
        const base64Content = fs.readFileSync(legacyConfigFile, 'utf-8')
        const jsonContent = Buffer.from(base64Content, 'base64').toString('utf-8')
        db.saveConfig('app_config', jsonContent)
        console.log('配置已从旧格式迁移到数据库')
      } catch (error) {
        console.error('迁移配置失败:', error)
      }
    } else if (fs.existsSync(configFile)) {
      // 迁移 config.json 到数据库
      try {
        const configContent = fs.readFileSync(configFile, 'utf-8')
        db.saveConfig('app_config', configContent)
        // 备份旧文件
        fs.renameSync(configFile, configFile + '.backup')
        console.log('配置已从文件迁移到数据库')
      } catch (error) {
        console.error('迁移配置失败:', error)
      }
    }
  }

  // 迁移旧配置
  migrateOldConfig()

  ipcMain.handle('config:get', () => {
    try {
      // 优先读取环境变量配置
      if (process.env.TASK_TYPES_CONFIG) {
        try {
          return process.env.TASK_TYPES_CONFIG
        } catch (error) {
          console.error('解析环境变量配置失败:', error)
        }
      }

      // 从数据库读取配置
      const configContent = db.getConfig('app_config')
      if (configContent) {
        return configContent
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
      // 验证是否为有效的JSON
      JSON.parse(configContent)
      db.saveConfig('app_config', configContent)
      return true
    } catch (error) {
      console.error('保存配置失败:', error)
      return false
    }
  })

  // 数据导出
  ipcMain.handle('data:export', async () => {
    try {
      const configContent = db.getConfig('app_config')
      const exportData = {
        version: app.getVersion(),
        exportTime: new Date().toISOString(),
        config: configContent ? JSON.parse(configContent) : defaultConfig,
        projects: db.getProjects(),
        modules: [],
        tasks: []
      }

      // 获取所有项目的模块和任务
      exportData.projects.forEach(project => {
        const modules = db.getModules(project.id, true)
        const tasks = db.getTasks(project.id)
        exportData.modules.push(...modules)
        exportData.tasks.push(...tasks)
      })

      const zip = new AdmZip()
      
      // 添加 JSON 格式数据（用于兼容性和可读性）
      zip.addFile('data.json', Buffer.from(JSON.stringify(exportData, null, 2), 'utf8'))
      
      // 添加数据库文件（用于快速恢复）
      if (fs.existsSync(dbFile)) {
        zip.addLocalFile(dbFile, '', 'tasklog.db')
      }

      // 添加图片文件夹
      if (fs.existsSync(imagesDir)) {
        zip.addLocalFolder(imagesDir, 'images')
      }

      // 添加说明文件
      const readmeContent = `# TaskLog 数据备份

## 备份信息
- 版本: ${app.getVersion()}
- 备份时间: ${new Date().toISOString()}
- 项目数: ${exportData.projects.length}
- 任务数: ${exportData.tasks.length}

## 文件说明
- **tasklog.db** - 数据库文件（推荐用于快速恢复）
- **data.json** - JSON 格式数据（用于兼容性和查看）
- **images/** - 图片附件文件夹

## 恢复方式

### 方式 1：使用应用内导入功能（推荐）
1. 打开 TaskLog 应用
2. 进入"设置" → "隐私与数据"
3. 点击"导入数据"
4. 选择此备份文件

### 方式 2：手动恢复数据库文件（快速）
1. 关闭 TaskLog 应用
2. 找到数据目录：
   - Windows: %APPDATA%/task-log/tasksData/
   - macOS: ~/Library/Application Support/task-log/tasksData/
   - Linux: ~/.config/task-log/tasksData/
3. 备份当前的 tasklog.db 文件
4. 将此备份中的 tasklog.db 复制到数据目录
5. 将 images 文件夹也复制过去
6. 重新启动应用

## 注意事项
- 手动恢复前请先备份当前数据
- 确保应用已完全关闭再进行手动恢复
- 建议定期备份数据
`
      zip.addFile('README.txt', Buffer.from(readmeContent, 'utf8'))

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
        let hasDbFile = false

        if (ext === '.zip') {
          const zip = new AdmZip(filePath)
          const zipEntries = zip.getEntries()

          // 检查是否包含数据库文件
          const dbEntry = zipEntries.find(entry => entry.entryName === 'tasklog.db')
          
          if (dbEntry) {
            // 优先使用数据库文件恢复（更快更可靠）
            console.log('检测到数据库文件，使用数据库文件恢复...')
            
            // 关闭当前数据库
            db.close()
            
            // 备份当前数据库
            if (fs.existsSync(dbFile)) {
              const backupPath = dbFile + '.before-import-' + Date.now()
              fs.copyFileSync(dbFile, backupPath)
              console.log('当前数据库已备份到:', backupPath)
            }
            
            // 解压数据库文件
            zip.extractEntryTo(dbEntry, dataDir, false, true)
            console.log('数据库文件已恢复')
            
            // 恢复图片文件
            const imageEntries = zipEntries.filter(entry => entry.entryName.startsWith('images/'))
            if (imageEntries.length > 0) {
              zip.extractAllTo(dataDir, true)
              console.log('图片文件已恢复')
            }
            
            // 重新初始化数据库
            await db.init()
            console.log('数据库重新初始化完成')
            
            hasDbFile = true
          } else {
            // 使用 JSON 文件导入（兼容旧版本）
            console.log('未检测到数据库文件，使用 JSON 文件导入...')
            
            const dataEntry = zipEntries.find(entry => entry.entryName === 'data.json')
            if (!dataEntry) {
              return { success: false, error: '无效的备份文件：找不到 data.json 或 tasklog.db' }
            }
            importData = JSON.parse(dataEntry.getData().toString('utf8'))

            // 恢复图片
            zip.extractAllTo(dataDir, true)
          }
        } else {
          // 兼容旧版 JSON 导入
          console.log('导入 JSON 文件...')
          importData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        }

        // 如果使用 JSON 导入，需要清空数据库并导入
        if (!hasDbFile) {
          // 验证数据格式
          if (!importData.version || !importData.config || !importData.projects || !importData.modules || !importData.tasks) {
            return { success: false, error: '数据格式不正确' }
          }

          // 备份当前数据库
          if (fs.existsSync(dbFile)) {
            const backupPath = dbFile + '.before-import-' + Date.now()
            fs.copyFileSync(dbFile, backupPath)
            console.log('当前数据库已备份到:', backupPath)
          }

          // 关闭并删除当前数据库
          db.close()
          if (fs.existsSync(dbFile)) {
            fs.unlinkSync(dbFile)
          }

          // 重新初始化数据库
          await db.init()

          // 使用数据库的迁移方法导入数据
          db.migrateFromJSON(importData)
          console.log('JSON 数据导入完成')
        }

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
  // 关闭数据库
  if (db) {
    db.close()
  }
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  // 确保数据库被正确关闭
  if (db) {
    db.close()
  }
})