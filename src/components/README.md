# 组件说明

## 目录结构

```
components/
├── common/          # 通用基础组件
│   ├── ConfirmModal.jsx
│   ├── ImagePreview.jsx
│   ├── ImagePreview.module.css
│   ├── Modal.module.css
│   ├── TaskImage.jsx
│   ├── WindowControls.jsx
│   └── WindowControls.module.css
├── project/         # 项目相关组件
│   ├── ProjectCard.jsx
│   ├── ProjectCard.module.css
│   ├── ProjectMemoModal.jsx
│   ├── ProjectMemoView.jsx
│   ├── ProjectMemoView.module.css
│   ├── ProjectModal.jsx
│   ├── ProjectSelectView.jsx
│   └── ProjectSelectView.module.css
├── task/            # 任务相关组件
│   ├── CompletionStats.jsx
│   ├── CompletionStatsModal.module.css
│   ├── EditModuleListModal.jsx
│   ├── EditTaskModuleModal.jsx
│   ├── ExportPendingTasksModal.jsx
│   ├── ExportPendingTasksModal.module.css
│   ├── ModuleGroup.jsx
│   ├── ModuleGroup.module.css
│   ├── ModuleStats.jsx
│   ├── ModuleStatsModal.module.css
│   ├── RecycleBin.jsx
│   ├── ShelvedTasksModal.jsx
│   ├── StatsModal.jsx
│   ├── StatsModal.module.css
│   ├── TaskCard.jsx
│   ├── TaskCard.module.css
│   ├── TaskManageView.jsx
│   ├── TaskManageView.module.css
│   ├── TaskModal.jsx
│   └── TaskModal.module.css
└── settings/        # 设置相关组件
    ├── AboutSettings.jsx
    ├── GeneralSettings.jsx
    ├── PrivacySettings.jsx
    ├── SettingsModal.jsx
    ├── SettingsModal.module.css
    ├── TaskTypeCard.jsx
    └── TaskTypesSettings.jsx
```

## 组件分类

### common/ - 通用基础组件
- **WindowControls.jsx** - 窗口控制栏组件(最小化、最大化、关闭按钮)
- **WindowControls.module.css** - 窗口控制栏样式
- **TaskImage.jsx** - 图片显示组件(处理本地文件路径)
- **ImagePreview.jsx** - 图片预览模态框(支持键盘导航)
- **ImagePreview.module.css** - 图片预览样式
- **ConfirmModal.jsx** - 确认删除模态框
- **Modal.module.css** - 模态框通用样式

### project/ - 项目相关组件
- **ProjectSelectView.jsx** - 项目选择视图(整合项目列表和相关模态框)
- **ProjectSelectView.module.css** - 项目选择视图样式
- **ProjectCard.jsx** - 项目卡片组件
- **ProjectCard.module.css** - 项目卡片样式
- **ProjectModal.jsx** - 项目创建/编辑模态框
- **ProjectMemoModal.jsx** - 项目备忘编辑模态框
- **ProjectMemoView.jsx** - 项目备忘便签查看组件
- **ProjectMemoView.module.css** - 项目备忘查看样式

### task/ - 任务相关组件
- **TaskManageView.jsx** - 任务管理视图
- **TaskManageView.module.css** - 任务管理视图样式
- **TaskCard.jsx** - 任务卡片组件(支持代码块、图片等)
- **TaskCard.module.css** - 任务卡片样式
- **TaskModal.jsx** - 任务添加/编辑模态框
- **TaskModal.module.css** - 任务模态框样式
- **ModuleGroup.jsx** - 模块分组组件(包含模块名编辑功能)
- **ModuleGroup.module.css** - 模块分组样式
- **CompletionStats.jsx** - 完成统计组件
- **CompletionStatsModal.module.css** - 完成统计模态框样式
- **ModuleStats.jsx** - 模块统计组件
- **ModuleStatsModal.module.css** - 模块统计模态框样式
- **StatsModal.jsx** - 统计模态框组件
- **StatsModal.module.css** - 统计模态框样式
- **EditModuleListModal.jsx** - 编辑模块列表模态框
- **EditTaskModuleModal.jsx** - 编辑任务模块模态框
- **ExportPendingTasksModal.jsx** - 导出待办任务模态框
- **ExportPendingTasksModal.module.css** - 导出待办任务模态框样式
- **RecycleBin.jsx** - 回收站组件
- **ShelvedTasksModal.jsx** - 搁置任务模态框

### settings/ - 设置相关组件
- **SettingsModal.jsx** - 设置模态框组件
- **SettingsModal.module.css** - 设置模态框样式
- **GeneralSettings.jsx** - 通用设置组件
- **AboutSettings.jsx** - 关于设置组件
- **PrivacySettings.jsx** - 隐私设置组件
- **TaskTypesSettings.jsx** - 任务类型设置组件
- **TaskTypeCard.jsx** - 任务类型卡片组件

## 自定义 Hooks

### useTaskModal (src/hooks/useTaskModal.js)
管理任务模态框相关状态和逻辑:
- 新增/编辑任务表单状态
- 下拉菜单显示状态
- 拖拽上传状态
- 图片粘贴处理
- 输入框 refs

### useTaskManager (src/hooks/useTaskManager.js)
管理任务数据和业务逻辑:
- 加载模块、任务、统计数据
- 任务搜索和过滤
- 模块展开/收起状态
- 模块名编辑功能
- 按模块分组任务

## 主应用 (src/App.jsx)

主应用文件现在只包含:
- 视图切换逻辑
- 项目管理逻辑
- 任务操作处理函数
- 图片预览逻辑
- 两个视图组件的渲染

代码行数从 2000+ 行减少到约 600 行。
