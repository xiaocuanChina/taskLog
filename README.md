# TaskLog - 任务日志管理应用

> 觉得用 MD 记录任务不太方便，于是 TaskLog 诞生了！

一个基于 Electron + React + Vite 构建的现代化任务管理桌面应用，专注于简洁高效的任务记录体验。

## ✨ 核心特性

### 📋 项目与任务管理
- **多项目支持**：创建多个项目，独立管理各项目任务
- **模块化组织**：任务按模块分组，支持模块折叠/展开
- **任务类型**：支持自定义任务类型（BUG、代办、优化等）及颜色标识
- **任务状态**：待办/已完成状态管理，支持状态回滚
- **快速操作**：拖拽排序、快速添加、批量管理

### 📝 丰富的任务信息
- **基础信息**：任务描述、所属模块、任务类型
- **人员管理**：支持发起人和执行人字段
- **备注说明**：详细的任务备注信息
- **代码块**：支持添加代码片段，内置语法高亮（基于 Prism.js）
- **图片附件**：支持拖拽、粘贴上传图片，内置图片预览器

### 📊 数据统计与导出
- **实时统计**：今日完成数、待办任务数、总任务数
- **日报导出**：一键导出今日完成任务为 Excel 报表
- **搜索过滤**：支持按任务名称、模块、备注等多维度搜索

### 🎨 用户体验
- **现代化 UI**：基于 Ant Design 组件库，美观流畅
- **无边框窗口**：自定义窗口控制栏，支持最小化/最大化/关闭
- **项目备忘**：为每个项目添加备忘录，记录重要信息
- **本地存储**：所有数据存储在本地，保护隐私安全
- **响应式设计**：适配不同屏幕尺寸

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发环境（Vite + Electron）
npm start

# 或单独启动 Vite 开发服务器
npm run dev
```

开发模式下会自动打开开发者工具，支持热重载。

## 🏷️ 版本管理

项目版本号统一在 `package.json` 中管理，使用 npm 内置命令修改：

```bash
# 补丁版本 0.0.1 → 0.0.2
npm version patch

# 次版本 0.1.0 → 0.1.0
npm version minor

# 主版本 1.0.0 → 2.0.0
npm version major

# 指定版本
npm version 1.2.3
```

修改后会自动同步到：打包版本、关于对话框、数据导出标记。

## 📦 构建与打包

### 构建前端资源

```bash
npm run build
```

### 打包桌面应用

```bash
# 标准打包
npm run electron:build

# 使用代理打包（PowerShell，需管理员权限）
$env:HTTP_PROXY="http://127.0.0.1:10808"; $env:HTTPS_PROXY="http://127.0.0.1:10808"; npm run electron:build
```

打包后的应用位于 `release` 目录。

## ⚙️ 配置说明

### 任务类型配置

支持三种配置方式（优先级从高到低）：

#### 1. 环境变量配置

创建 `.env` 文件：

```bash
TASK_TYPES_CONFIG={"taskTypes":[{"name":"BUG","color":"#ff4d4f"}]}
```

#### 2. JSON 配置文件（推荐）

编辑 `tasksData/config.json`：

```json
{
  "taskTypes": [
    {
      "name": "BUG",
      "color": "#ff4d4f"
    },
    {
      "name": "代办",
      "color": "#1890ff"
    },
    {
      "name": "优化",
      "color": "#52c41a"
    },
    {
      "name": "其他",
      "color": "#463e2e"
    }
  ]
}
```

#### 3. 默认配置

未配置时使用内置默认配置。

### 配置迁移

从旧版本迁移配置：

```bash
npm run config:migrate
```

详细配置说明请参考 [CONFIG_GUIDE.md](./CONFIG_GUIDE.md)

## 🛠️ 技术栈

### 前端技术
- **React 18** - UI 框架
- **Ant Design 6** - UI 组件库
- **Vite 5** - 构建工具
- **CSS Modules** - 样式方案

### 桌面技术
- **Electron 32** - 桌面应用框架
- **electron-builder** - 应用打包工具

### 功能库
- **@dnd-kit** - 拖拽排序
- **react-simple-code-editor** - 代码编辑器
- **react-syntax-highlighter** - 语法高亮
- **prismjs** - 代码高亮引擎
- **xlsx** - Excel 导出
- **sql.js** - SQLite 数据库（纯 JavaScript 实现）

## 📂 项目结构

```
TaskLog/
├── electron/                    # Electron 主进程
│   ├── main.js                 # 主进程入口
│   ├── preload.js              # 预加载脚本
│   └── database.js             # 数据库管理模块（新增）
├── src/                        # React 源代码
│   ├── components/             # 组件目录
│   │   ├── common/            # 通用组件（Toast、Modal、图片预览等）
│   │   ├── project/           # 项目相关组件
│   │   ├── task/              # 任务相关组件
│   │   └── settings/          # 设置相关组件
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useTaskModal.js    # 任务模态框逻辑
│   │   └── useTaskManager.js  # 任务管理逻辑
│   ├── utils/                 # 工具函数
│   │   └── configManager.js   # 配置管理
│   ├── constants/             # 常量定义
│   ├── styles/                # 全局样式
│   ├── App.jsx                # 主应用组件
│   └── main.jsx               # React 入口
├── tasksData/                  # 数据目录
│   ├── tasklog.db             # SQLite 数据库（新）
│   └── images/                # 图片附件
├── scripts/                    # 脚本工具
│   └── migrate-config.js      # 配置迁移脚本
├── build/                      # 构建资源
├── dist/                       # Vite 构建输出
├── release/                    # 应用打包输出
├── index.html                  # HTML 入口
├── vite.config.mjs            # Vite 配置
├── package.json               # 项目配置
├── test-database.js           # 数据库测试脚本（新增）
├── CONFIG_GUIDE.md            # 配置指南
├── DATABASE_MIGRATION.md      # 数据库迁移说明（新增）
├── MIGRATION_SUMMARY.md       # 迁移完成总结（新增）
├── QUICK_START.md             # 快速启动指南（新增）
├── REFACTOR_SUMMARY.md        # 重构总结
└── README.md                  # 项目说明
```

## 📝 数据存储

应用现在使用 **SQLite 数据库** 存储数据，性能更好、更可靠！

### 数据位置

- **Windows**: `%APPDATA%/task-log/tasksData/`
- **macOS**: `~/Library/Application Support/task-log/tasksData/`
- **Linux**: `~/.config/task-log/tasksData/`

### 存储文件
- `tasklog.db` - SQLite 数据库文件（包含所有数据）
- `images/` - 图片附件目录

### 🔄 从旧版本升级

如果你之前使用的是 JSON 文件存储版本（v0.1.2 及更早版本）：

1. **自动迁移** - 应用启动时会自动检测并迁移数据
2. **数据备份** - 旧的 JSON 文件会被重命名为 `.backup` 后缀
3. **无缝切换** - 无需手动操作，数据完整性得到保证

详细说明请参考：
- [数据库迁移说明](./DATABASE_MIGRATION.md) - 完整的迁移文档
- [快速启动指南](./QUICK_START.md) - 快速上手指南
- [迁移完成总结](./MIGRATION_SUMMARY.md) - 迁移详情

## 数据管理

**导出数据**：设置 → 隐私与数据 → 导出数据（.zip 格式）  
**导入数据**：设置 → 隐私与数据 → 导入数据（支持 .zip 和 .json）

### 导出内容说明

导出的 ZIP 文件包含：
- **tasklog.db** - 数据库文件（用于快速恢复）
- **data.json** - JSON 格式数据（用于兼容性和查看）
- **images/** - 图片附件文件夹
- **README.txt** - 恢复说明文档

### 导入优先级

导入时会自动识别备份类型：
1. **优先使用数据库文件** - 如果备份中包含 `tasklog.db`，直接恢复（快速）
2. **使用 JSON 文件** - 如果只有 `data.json`，通过导入方式恢复（兼容旧版本）

## 🎯 功能详解

### 项目管理
- **创建项目**：在项目选择界面点击"新建项目"
- **编辑项目**：修改项目名称
- **删除项目**：删除项目及其所有任务（需确认）
- **项目排序**：拖拽调整项目顺序
- **项目备忘**：为项目添加备忘录信息

### 任务管理
- **添加任务**：填写任务信息，支持图片和代码块
- **编辑任务**：修改任务的所有信息
- **完成任务**：标记任务为已完成
- **回滚任务**：将已完成任务回滚到待办
- **删除任务**：永久删除任务（需确认）
- **任务搜索**：按关键词搜索任务

### 模块管理
- **自动创建**：添加任务时自动创建模块
- **模块编辑**：修改模块名称
- **模块删除**：删除模块及其任务
- **模块排序**：拖拽调整模块顺序
- **模块折叠**：折叠/展开模块任务列表

### 数据导出
- **日报导出**：导出今日完成的任务为 Excel 文件
- **导出内容**：包含任务类型、模块、描述、发起人、执行人、完成时间等信息

## 🔧 开发指南

### 组件开发

项目采用组件化开发，每个组件职责单一：

- 通用组件放在 `src/components/common/`
- 业务组件按功能模块分类
- 使用 CSS Modules 避免样式冲突
- 组件内使用中文注释

### 自定义 Hooks

复杂的状态逻辑提取为自定义 Hooks：

- `useTaskModal` - 管理任务模态框状态和图片处理
- `useTaskManager` - 管理任务数据加载和过滤

### 代码规范

- 使用中文注释和日志
- 组件文件使用 `.jsx` 扩展名
- 样式文件使用 `.module.css` 扩展名
- 遵循 React Hooks 规范

## 📚 相关文档

- [快速启动指南](./QUICK_START.md) - 快速上手指南
- [数据库迁移说明](./DATABASE_MIGRATION.md) - 详细的数据库迁移文档
- [迁移完成总结](./MIGRATION_SUMMARY.md) - 数据库迁移完成情况
- [配置指南](./CONFIG_GUIDE.md) - 详细的配置说明
- [重构总结](./REFACTOR_SUMMARY.md) - 代码重构记录
- [Ant Design 迁移](./ANTD_MIGRATION.md) - UI 库迁移说明

## 🐛 问题反馈

如遇到问题或有功能建议，欢迎提交 Issue。

## 👨‍💻 作者

**小爨**

## 📄 版本

当前版本：**v0.2.0**

### 最新更新（v0.2.0）

- ✨ 迁移到 SQLite 数据库存储
- 🚀 性能和可靠性大幅提升
- 🔄 自动数据迁移，无缝升级
- 📊 更好的数据完整性保证

详细更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)

## 📜 许可证

MIT License

