# 组件说明

## 目录结构

```
components/
├── common/          # 通用基础组件
├── project/         # 项目相关组件
├── task/            # 任务相关组件
└── settings/        # 设置相关组件
```

## 组件分类

### common/ - 通用基础组件
- **WindowControls.jsx** - 窗口控制栏组件(最小化、最大化、关闭按钮)
- **Toast.jsx** - 提示消息组件
- **TaskImage.jsx** - 图片显示组件(处理本地文件路径)
- **ImagePreview.jsx** - 图片预览模态框(支持键盘导航)
- **ConfirmModal.jsx** - 确认删除模态框
- **Modal.module.css** - 模态框通用样式

### project/ - 项目相关组件
- **ProjectSelectView.jsx** - 项目选择视图(整合项目列表和相关模态框)
- **ProjectCard.jsx** - 项目卡片组件
- **ProjectModal.jsx** - 项目创建/编辑模态框
- **ProjectMemoModal.jsx** - 项目备忘编辑模态框
- **ProjectMemoView.jsx** - 项目备忘便签查看组件

### task/ - 任务相关组件
- **TaskManageView.jsx** - 任务管理视图
- **TaskCard.jsx** - 任务卡片组件(支持代码块、图片等)
- **TaskModal.jsx** - 任务添加/编辑模态框
- **ModuleGroup.jsx** - 模块分组组件(包含模块名编辑功能)

### settings/ - 设置相关组件
- **SettingsModal.jsx** - 设置模态框组件
- **TaskManageView.jsx** - 任务管理视图(整合任务列表和相关功能)

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
