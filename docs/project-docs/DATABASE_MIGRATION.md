# 数据库迁移说明

## 概述

项目已从 JSON 文件存储迁移到 SQLite 数据库存储，使用 `sql.js` 库实现。

## 迁移内容

### 原存储方式
- `tasks.json` - 任务数据
- `projects.json` - 项目数据
- `modules.json` - 模块数据
- `config.json` - 配置数据
- `images/` - 图片文件（保持不变）

### 新存储方式
- `tasklog.db` - SQLite 数据库文件（包含所有数据）
- `images/` - 图片文件（保持不变）

## 数据库结构

### projects 表
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  memo TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT
)
```

### modules 表
```sql
CREATE TABLE modules (
  id TEXT PRIMARY KEY,
  projectId TEXT NOT NULL,
  name TEXT NOT NULL,
  "order" INTEGER,
  deleted INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
)
```

### tasks 表
```sql
CREATE TABLE tasks (
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
```

### config 表
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT
)
```

## 自动迁移

应用启动时会自动检测旧的 JSON 文件并迁移到数据库：

1. 检测 `tasks.json`、`projects.json`、`modules.json` 是否存在
2. 如果存在且数据库为空，自动导入数据
3. 迁移完成后，旧文件会被重命名为 `.backup` 后缀

## 优势

### 性能提升
- 使用索引加速查询
- 减少文件 I/O 操作
- 支持复杂查询和关联查询

### 数据完整性
- 外键约束确保数据一致性
- 级联删除自动清理关联数据
- 事务支持（虽然 sql.js 不完全支持，但提供了基础保障）

### 可扩展性
- 易于添加新字段和表
- 支持数据库迁移脚本
- 便于实现高级功能（如全文搜索）

## 注意事项

1. **数据备份**：迁移前建议先导出数据备份
2. **兼容性**：导入导出功能保持向后兼容
3. **性能**：sql.js 是纯 JavaScript 实现，性能略低于原生 SQLite，但对于桌面应用足够使用

## 技术选型

### 为什么选择 sql.js？

1. **无需编译**：纯 JavaScript 实现，不需要 node-gyp 编译
2. **跨平台**：在 Windows、macOS、Linux 上都能正常运行
3. **易于集成**：与 Electron 完美配合
4. **体积小**：相比 better-sqlite3 更轻量

### 替代方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| sql.js | 无需编译、跨平台 | 性能略低、内存占用稍高 |
| better-sqlite3 | 性能最佳 | 需要编译、依赖 Visual Studio |
| lowdb | 简单易用 | 功能有限、不支持复杂查询 |

## 使用示例

### 查询数据
```javascript
// 获取项目列表
const projects = db.getProjects()

// 获取项目的任务
const tasks = db.getTasks(projectId)

// 获取模块列表
const modules = db.getModules(projectId, includeDeleted)
```

### 添加数据
```javascript
// 添加项目
const project = db.addProject({
  id: 'xxx',
  name: '项目名称',
  memo: '备注',
  createdAt: new Date().toISOString()
})

// 添加任务
const task = db.addTask({
  id: 'xxx',
  projectId: 'xxx',
  name: '任务名称',
  // ... 其他字段
})
```

### 更新数据
```javascript
// 更新项目
db.updateProject(projectId, {
  name: '新名称',
  updatedAt: new Date().toISOString()
})

// 更新任务
db.updateTask(taskId, {
  completed: true,
  completedAt: new Date().toISOString()
})
```

### 删除数据
```javascript
// 删除项目（级联删除关联的模块和任务）
db.deleteProject(projectId)

// 逻辑删除模块
db.deleteModule(moduleId)

// 永久删除模块
db.permanentDeleteModule(moduleId)
```

## 故障排查

### 数据库文件损坏
如果数据库文件损坏，可以：
1. 从备份恢复
2. 使用导入功能重新导入数据
3. 删除 `tasklog.db` 文件，应用会自动创建新数据库

### 迁移失败
如果自动迁移失败：
1. 检查旧 JSON 文件格式是否正确
2. 查看控制台错误日志
3. 手动使用导入功能导入备份文件

### 性能问题
如果遇到性能问题：
1. 检查数据量是否过大
2. 考虑定期清理已完成的旧任务
3. 使用导出功能定期备份并清理数据

