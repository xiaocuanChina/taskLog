/**
 * 数据库管理模块
 * 使用 sql.js 实现 SQLite 数据库存储
 */

const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

class Database {
  constructor(dbPath) {
    this.dbPath = dbPath
    this.db = null
  }

  /**
   * 初始化数据库
   */
  async init() {
    const SQL = await initSqlJs()
    
    // 如果数据库文件存在，加载它
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath)
      this.db = new SQL.Database(buffer)
    } else {
      // 创建新数据库
      this.db = new SQL.Database()
      this.createTables()
    }
  }

  /**
   * 创建数据表
   */
  createTables() {
    // 项目表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        memo TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT
      )
    `)

    // 模块表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        name TEXT NOT NULL,
        "order" INTEGER,
        deleted INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 创建模块索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_modules_projectId ON modules(projectId)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_modules_deleted ON modules(deleted)`)

    // 任务表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL,
        module TEXT,
        name TEXT NOT NULL,
        type TEXT,
        initiator TEXT,
        remark TEXT,
        images TEXT,
        codeBlock TEXT,
        checkItems TEXT,
        checkItemsBeforeComplete TEXT,
        completed INTEGER DEFAULT 0,
        shelved INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        shelvedAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)

    // 创建任务索引
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_projectId ON tasks(projectId)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_shelved ON tasks(shelved)`)
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_tasks_module ON tasks(module)`)

    // 配置表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT
      )
    `)

    this.save()
  }

  /**
   * 保存数据库到文件
   */
  save() {
    if (!this.db) return
    const data = this.db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(this.dbPath, buffer)
  }

  /**
   * 关闭数据库
   */
  close() {
    if (this.db) {
      this.save()
      this.db.close()
      this.db = null
    }
  }

  // ==================== 项目管理 ====================

  /**
   * 获取所有项目
   */
  getProjects() {
    const stmt = this.db.prepare('SELECT * FROM projects ORDER BY createdAt DESC')
    const projects = []
    while (stmt.step()) {
      projects.push(stmt.getAsObject())
    }
    stmt.free()
    return projects
  }

  /**
   * 添加项目
   */
  addProject(project) {
    const stmt = this.db.prepare(`
      INSERT INTO projects (id, name, memo, createdAt)
      VALUES (?, ?, ?, ?)
    `)
    stmt.run([project.id, project.name, project.memo || '', project.createdAt])
    stmt.free()
    this.save()
    return project
  }

  /**
   * 更新项目
   */
  updateProject(id, updates) {
    const fields = []
    const values = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.memo !== undefined) {
      fields.push('memo = ?')
      values.push(updates.memo)
    }
    if (updates.updatedAt !== undefined) {
      fields.push('updatedAt = ?')
      values.push(updates.updatedAt)
    }

    if (fields.length === 0) return false

    values.push(id)
    const stmt = this.db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(values)
    stmt.free()
    this.save()
    return true
  }

  /**
   * 删除项目
   */
  deleteProject(id) {
    // 先删除项目下的所有任务和模块（通过外键级联删除）
    const stmt = this.db.prepare('DELETE FROM projects WHERE id = ?')
    stmt.run([id])
    stmt.free()
    this.save()
    return true
  }

  /**
   * 重新排序项目
   */
  reorderProjects(projectIds) {
    // sql.js 不支持事务，我们需要手动处理
    // 这里简单地按照新顺序重新插入
    // 由于项目表没有 order 字段，我们通过删除并重新插入来实现排序
    // 更好的方式是添加 order 字段，但为了保持简单，我们暂时不这样做
    // 实际上，前端可以通过 createdAt 或其他方式来排序
    return true
  }

  // ==================== 模块管理 ====================

  /**
   * 获取项目的模块列表
   */
  getModules(projectId, includeDeleted = false) {
    let sql = 'SELECT * FROM modules WHERE projectId = ?'
    if (!includeDeleted) {
      sql += ' AND deleted = 0'
    }
    sql += ' ORDER BY "order" ASC, createdAt ASC'

    const stmt = this.db.prepare(sql)
    stmt.bind([projectId])
    const modules = []
    while (stmt.step()) {
      modules.push(stmt.getAsObject())
    }
    stmt.free()
    return modules
  }

  /**
   * 添加模块
   */
  addModule(module) {
    const stmt = this.db.prepare(`
      INSERT INTO modules (id, projectId, name, "order", deleted, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run([
      module.id,
      module.projectId,
      module.name,
      module.order || null,
      module.deleted ? 1 : 0,
      module.createdAt
    ])
    stmt.free()
    this.save()
    return module
  }

  /**
   * 更新模块
   */
  updateModule(id, updates) {
    const fields = []
    const values = []

    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.order !== undefined) {
      fields.push('"order" = ?')
      values.push(updates.order)
    }
    if (updates.deleted !== undefined) {
      fields.push('deleted = ?')
      values.push(updates.deleted ? 1 : 0)
    }
    if (updates.updatedAt !== undefined) {
      fields.push('updatedAt = ?')
      values.push(updates.updatedAt)
    }

    if (fields.length === 0) return false

    values.push(id)
    const stmt = this.db.prepare(`UPDATE modules SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(values)
    stmt.free()
    this.save()
    return true
  }

  /**
   * 删除模块（逻辑删除）
   */
  deleteModule(id) {
    return this.updateModule(id, { deleted: true, updatedAt: new Date().toISOString() })
  }

  /**
   * 恢复模块
   */
  restoreModule(id) {
    return this.updateModule(id, { deleted: false, updatedAt: new Date().toISOString() })
  }

  /**
   * 永久删除模块
   */
  permanentDeleteModule(id) {
    const stmt = this.db.prepare('DELETE FROM modules WHERE id = ?')
    stmt.run([id])
    stmt.free()
    this.save()
    return true
  }

  /**
   * 检查模块是否存在
   */
  moduleExists(projectId, name, excludeId = null) {
    let sql = 'SELECT id FROM modules WHERE projectId = ? AND name = ?'
    const params = [projectId, name]

    if (excludeId) {
      sql += ' AND id != ?'
      params.push(excludeId)
    }

    const stmt = this.db.prepare(sql)
    stmt.bind(params)
    const exists = stmt.step()
    stmt.free()
    return exists
  }

  /**
   * 根据ID获取模块
   */
  getModuleById(id) {
    const stmt = this.db.prepare('SELECT * FROM modules WHERE id = ?')
    stmt.bind([id])
    let module = null
    if (stmt.step()) {
      module = stmt.getAsObject()
    }
    stmt.free()
    return module
  }

  // ==================== 任务管理 ====================

  /**
   * 获取项目的任务列表
   */
  getTasks(projectId) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE projectId = ? ORDER BY createdAt DESC')
    stmt.bind([projectId])
    const tasks = []
    while (stmt.step()) {
      const task = stmt.getAsObject()
      // 解析 JSON 字段
      if (task.images) task.images = JSON.parse(task.images)
      if (task.codeBlock) task.codeBlock = JSON.parse(task.codeBlock)
      if (task.checkItems) task.checkItems = JSON.parse(task.checkItems)
      if (task.checkItemsBeforeComplete) task.checkItemsBeforeComplete = JSON.parse(task.checkItemsBeforeComplete)
      // 转换布尔值
      task.completed = task.completed === 1
      task.shelved = task.shelved === 1
      tasks.push(task)
    }
    stmt.free()
    return tasks
  }

  /**
   * 添加任务
   */
  addTask(task) {
    const stmt = this.db.prepare(`
      INSERT INTO tasks (
        id, projectId, module, name, type, initiator, remark,
        images, codeBlock, checkItems, completed, shelved,
        createdAt, completedAt, shelvedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run([
      task.id,
      task.projectId,
      task.module || '',
      task.name,
      task.type || '',
      task.initiator || '',
      task.remark || '',
      JSON.stringify(task.images || []),
      JSON.stringify(task.codeBlock || { enabled: false, language: 'javascript', code: '' }),
      JSON.stringify(task.checkItems || { enabled: false, mode: 'multiple', items: [] }),
      task.completed ? 1 : 0,
      task.shelved ? 1 : 0,
      task.createdAt,
      task.completedAt || null,
      task.shelvedAt || null
    ])
    stmt.free()
    this.save()
    return task
  }

  /**
   * 更新任务
   */
  updateTask(id, updates) {
    const fields = []
    const values = []

    if (updates.module !== undefined) {
      fields.push('module = ?')
      values.push(updates.module)
    }
    if (updates.name !== undefined) {
      fields.push('name = ?')
      values.push(updates.name)
    }
    if (updates.type !== undefined) {
      fields.push('type = ?')
      values.push(updates.type)
    }
    if (updates.initiator !== undefined) {
      fields.push('initiator = ?')
      values.push(updates.initiator)
    }
    if (updates.remark !== undefined) {
      fields.push('remark = ?')
      values.push(updates.remark)
    }
    if (updates.images !== undefined) {
      fields.push('images = ?')
      values.push(JSON.stringify(updates.images))
    }
    if (updates.codeBlock !== undefined) {
      fields.push('codeBlock = ?')
      values.push(JSON.stringify(updates.codeBlock))
    }
    if (updates.checkItems !== undefined) {
      fields.push('checkItems = ?')
      values.push(JSON.stringify(updates.checkItems))
    }
    if (updates.checkItemsBeforeComplete !== undefined) {
      fields.push('checkItemsBeforeComplete = ?')
      values.push(JSON.stringify(updates.checkItemsBeforeComplete))
    }
    if (updates.completed !== undefined) {
      fields.push('completed = ?')
      values.push(updates.completed ? 1 : 0)
    }
    if (updates.shelved !== undefined) {
      fields.push('shelved = ?')
      values.push(updates.shelved ? 1 : 0)
    }
    if (updates.completedAt !== undefined) {
      fields.push('completedAt = ?')
      values.push(updates.completedAt)
    }
    if (updates.shelvedAt !== undefined) {
      fields.push('shelvedAt = ?')
      values.push(updates.shelvedAt)
    }
    if (updates.updatedAt !== undefined) {
      fields.push('updatedAt = ?')
      values.push(updates.updatedAt)
    }

    if (fields.length === 0) return null

    values.push(id)
    const stmt = this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`)
    stmt.run(values)
    stmt.free()
    this.save()

    // 返回更新后的任务
    return this.getTaskById(id)
  }

  /**
   * 根据ID获取任务
   */
  getTaskById(id) {
    const stmt = this.db.prepare('SELECT * FROM tasks WHERE id = ?')
    stmt.bind([id])
    let task = null
    if (stmt.step()) {
      task = stmt.getAsObject()
      // 解析 JSON 字段
      if (task.images) task.images = JSON.parse(task.images)
      if (task.codeBlock) task.codeBlock = JSON.parse(task.codeBlock)
      if (task.checkItems) task.checkItems = JSON.parse(task.checkItems)
      if (task.checkItemsBeforeComplete) task.checkItemsBeforeComplete = JSON.parse(task.checkItemsBeforeComplete)
      // 转换布尔值
      task.completed = task.completed === 1
      task.shelved = task.shelved === 1
    }
    stmt.free()
    return task
  }

  /**
   * 删除任务
   */
  deleteTask(id) {
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?')
    stmt.run([id])
    stmt.free()
    this.save()
    return true
  }

  /**
   * 获取项目下使用指定模块的任务数量
   */
  getTaskCountByModule(projectId, moduleName) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE projectId = ? AND module = ?')
    stmt.bind([projectId, moduleName])
    let count = 0
    if (stmt.step()) {
      count = stmt.getAsObject().count
    }
    stmt.free()
    return count
  }

  /**
   * 获取项目下使用指定模块的未完成任务数量
   */
  getPendingTaskCountByModule(projectId, moduleName) {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE projectId = ? AND module = ? AND completed = 0')
    stmt.bind([projectId, moduleName])
    let count = 0
    if (stmt.step()) {
      count = stmt.getAsObject().count
    }
    stmt.free()
    return count
  }

  /**
   * 批量更新任务的模块名称
   */
  updateTasksModule(projectId, oldModuleName, newModuleName) {
    const stmt = this.db.prepare('UPDATE tasks SET module = ? WHERE projectId = ? AND module = ?')
    stmt.run([newModuleName, projectId, oldModuleName])
    stmt.free()
    this.save()
    return true
  }

  // ==================== 配置管理 ====================

  /**
   * 获取配置
   */
  getConfig(key) {
    const stmt = this.db.prepare('SELECT value FROM config WHERE key = ?')
    stmt.bind([key])
    let value = null
    if (stmt.step()) {
      value = stmt.getAsObject().value
    }
    stmt.free()
    return value
  }

  /**
   * 保存配置
   */
  saveConfig(key, value) {
    // 先尝试更新
    const updateStmt = this.db.prepare('UPDATE config SET value = ?, updatedAt = ? WHERE key = ?')
    updateStmt.run([value, new Date().toISOString(), key])
    updateStmt.free()

    // 如果没有更新任何行，则插入
    const checkStmt = this.db.prepare('SELECT key FROM config WHERE key = ?')
    checkStmt.bind([key])
    const exists = checkStmt.step()
    checkStmt.free()

    if (!exists) {
      const insertStmt = this.db.prepare('INSERT INTO config (key, value, updatedAt) VALUES (?, ?, ?)')
      insertStmt.run([key, value, new Date().toISOString()])
      insertStmt.free()
    }

    this.save()
    return true
  }

  // ==================== 数据迁移 ====================

  /**
   * 从 JSON 文件迁移数据到数据库
   */
  migrateFromJSON(jsonData) {
    // 迁移项目
    if (jsonData.projects && Array.isArray(jsonData.projects)) {
      jsonData.projects.forEach(project => {
        this.addProject(project)
      })
    }

    // 迁移模块
    if (jsonData.modules && Array.isArray(jsonData.modules)) {
      jsonData.modules.forEach(module => {
        this.addModule(module)
      })
    }

    // 迁移任务
    if (jsonData.tasks && Array.isArray(jsonData.tasks)) {
      jsonData.tasks.forEach(task => {
        this.addTask(task)
      })
    }

    // 迁移配置
    if (jsonData.config) {
      this.saveConfig('app_config', JSON.stringify(jsonData.config))
    }

    this.save()
  }

  /**
   * 导出数据为 JSON 格式
   */
  exportToJSON() {
    const allProjects = this.getProjects()
    const allModules = []
    const allTasks = []

    // 获取所有项目的模块和任务
    allProjects.forEach(project => {
      const modules = this.getModules(project.id, true)
      const tasks = this.getTasks(project.id)
      allModules.push(...modules)
      allTasks.push(...tasks)
    })

    return {
      projects: allProjects,
      modules: allModules,
      tasks: allTasks,
      config: JSON.parse(this.getConfig('app_config') || '{}')
    }
  }
}

module.exports = Database
