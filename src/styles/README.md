# CSS Modules 样式拆分说明

## 概述

已将原来的 `App.css` (2000+ 行) 拆分为 CSS Modules,每个组件都有独立的样式文件,提高了代码的可维护性和模块化程度。

## 文件结构

```
src/
├── styles/
│   └── common.module.css          # 公共样式(全局重置、通用按钮、表单、空状态等)
└── components/
    ├── WindowControls.module.css   # 窗口控制栏样式
    ├── Toast.module.css            # 提示消息样式
    ├── ProjectCard.module.css      # 项目卡片样式
    ├── Modal.module.css            # 模态框通用样式
    ├── ProjectMemoView.module.css  # 项目备忘查看样式
    ├── TaskCard.module.css         # 任务卡片样式
    ├── ModuleGroup.module.css      # 模块分组样式
    ├── ImagePreview.module.css     # 图片预览样式
    ├── TaskModal.module.css        # 任务模态框样式
    ├── ProjectSelectView.module.css # 项目选择视图样式
    └── TaskManageView.module.css   # 任务管理视图样式
```

## 公共样式 (common.module.css)

包含以下内容:
- 全局重置样式 (*, body)
- 应用容器 (.appContainer)
- 通用按钮样式 (.btn, .btnPrimary, .btnSuccess, .btnSecondary, .btnDanger, .btnSm, .btnIcon)
- 表单样式 (.formGroup, .formLabel, .formInput)
- 空状态样式 (.emptyState, .emptyIcon, .emptyText)
- 滚动条隐藏

## 组件样式说明

### 1. WindowControls.module.css
窗口控制栏相关样式,包括标题栏、按钮等。

### 2. Toast.module.css
Toast 提示消息样式,包括成功、错误、信息三种类型。

### 3. ProjectCard.module.css
项目卡片样式,包括卡片布局、操作按钮、图标等。

### 4. Modal.module.css
模态框通用样式,被以下组件共享:
- ProjectModal (项目创建/编辑)
- ProjectMemoModal (项目备忘编辑)
- ConfirmModal (确认删除)

### 5. ProjectMemoView.module.css
项目备忘便签查看样式,包括便签布局、动画效果等。

### 6. TaskCard.module.css
任务卡片样式,包括:
- 任务卡片布局
- 完成/删除/回滚按钮
- 任务类型标签
- 图片显示
- 代码块显示
- 编辑按钮

### 7. ModuleGroup.module.css
模块分组样式,包括模块标题、折叠图标、任务计数、模块名编辑等。

### 8. ImagePreview.module.css
图片预览模态框样式,包括导航按钮、关闭按钮、计数器等。

### 9. TaskModal.module.css
任务模态框样式,包括:
- 表单行布局
- 下拉选择框
- 图片上传区域
- 代码块编辑器

### 10. ProjectSelectView.module.css
项目选择视图样式,包括项目列表网格布局。

### 11. TaskManageView.module.css
任务管理视图样式,包括:
- 头部区域
- 项目备忘显示
- 操作栏
- 统计卡片
- 任务列表
- 搜索框

## 使用方式

### 引入样式

```jsx
// 引入组件自己的样式
import styles from './ComponentName.module.css'

// 引入公共样式
import commonStyles from '../styles/common.module.css'

// 引入其他组件的样式(如模态框)
import modalStyles from './Modal.module.css'
```

### 使用样式类

```jsx
// 单个样式类
<div className={styles.container}>

// 多个样式类
<div className={`${styles.card} ${styles.active}`}>

// 混合使用公共样式和组件样式
<button className={`${commonStyles.btn} ${commonStyles.btnPrimary}`}>

// 条件样式
<div className={`${styles.task} ${isCompleted ? styles.completed : ''}`}>
```

## 优势

1. **模块化**: 每个组件的样式独立,互不影响
2. **可维护性**: 样式和组件在同一目录,便于维护
3. **避免冲突**: CSS Modules 自动生成唯一的类名,避免样式冲突
4. **按需加载**: 只加载使用到的样式
5. **类型安全**: 可以配合 TypeScript 获得类名的智能提示

## 注意事项

1. 全局样式使用 `:global()` 包裹
2. 公共样式放在 `common.module.css` 中
3. 组件特有样式放在组件同名的 `.module.css` 文件中
4. 多个组件共享的样式(如 Modal)可以单独提取
5. 原 `App.css` 已不再使用,可以删除

## 迁移完成

✅ 所有组件已迁移到 CSS Modules
✅ 公共样式已提取到 common.module.css
✅ App.jsx 已移除对 App.css 的引用
✅ 所有样式功能保持不变
