# Ant Design UI 迁移说明

## 迁移概述

已将 `src/components` 目录下的所有组件从自定义 CSS Modules 迁移到 Ant Design UI 组件库。

## 已安装依赖

```bash
npm install antd @ant-design/icons
```

## 迁移的组件列表

### 1. 基础组件

- **Toast.jsx** - 使用 `message` API 替代自定义 Toast
- **WindowControls.jsx** - 保持原样（自定义窗口控制）
- **TaskImage.jsx** - 保持原样（处理本地图片路径）

### 2. 模态框组件

- **ProjectModal.jsx** - 使用 `Modal` + `Form` + `Input`
- **ProjectMemoModal.jsx** - 使用 `Modal` + `Form` + `TextArea`
- **ConfirmModal.jsx** - 使用 `Modal` + 危险按钮样式
- **TaskModal.jsx** - 使用 `Modal` + `Form` + `AutoComplete` + `Upload` + `Switch`

### 3. 卡片组件

- **ProjectCard.jsx** - 使用 `Card` + `Button` + `Space` + 图标
- **TaskCard.jsx** - 使用 `Card` + `Tag` + `Button` + `Tooltip`

### 4. 视图组件

- **ProjectSelectView.jsx** - 使用 `Button` + `Row/Col` + `Empty`
- **TaskManageView.jsx** - 使用 `Button` + `Input` + `Card` + `Row/Col` + `Empty` + `Space`
- **ProjectMemoView.jsx** - 使用 `Modal` + `Empty` + 图标

### 5. 列表组件

- **ModuleGroup.jsx** - 使用 `Collapse` + `Input` + `Button` + `Badge`
- **ImagePreview.jsx** - 使用 `Modal` + `Button` + 图标

## 主要使用的 Ant Design 组件

- **布局**: `Row`, `Col`, `Space`
- **表单**: `Form`, `Input`, `TextArea`, `AutoComplete`, `Switch`
- **数据展示**: `Card`, `Tag`, `Badge`, `Empty`, `Collapse`
- **反馈**: `Modal`, `message`, `Tooltip`
- **通用**: `Button`
- **图标**: `@ant-design/icons`

## 配置说明

在 `src/main.jsx` 中已配置:

```javascript
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'antd/dist/reset.css'

<ConfigProvider locale={zhCN}>
  <App />
</ConfigProvider>
```

- 引入了 Ant Design 的重置样式
- 配置了中文语言包
- 使用 ConfigProvider 包裹整个应用

## 样式调整

- 移除了大部分 CSS Modules 文件的依赖
- 使用内联样式和 Ant Design 的样式属性
- 保留了渐变背景等自定义样式
- 窗口控制栏保持原有样式

## 功能保持

所有原有功能均已保留:
- ✅ 项目管理（创建、编辑、删除）
- ✅ 任务管理（添加、编辑、完成、删除、回滚）
- ✅ 模块分组和折叠
- ✅ 图片上传和预览
- ✅ 代码块编辑
- ✅ 项目备忘
- ✅ 搜索过滤
- ✅ 数据统计
- ✅ 导出日报

## 优势

1. **统一的设计语言** - 使用 Ant Design 的设计规范
2. **更好的可访问性** - Ant Design 组件内置无障碍支持
3. **响应式设计** - 自动适配不同屏幕尺寸
4. **丰富的交互** - 内置动画和过渡效果
5. **易于维护** - 减少自定义样式代码
6. **国际化支持** - 已配置中文语言包

## 注意事项

1. Toast 组件现在使用 `message` API，需要在组件中使用 `useMessage` hook
2. 所有模态框的 `show` 属性对应 Ant Design 的 `open` 属性
3. 图标使用 `@ant-design/icons` 包，需要按需引入
4. 部分自定义样式使用内联 style 实现

## 后续优化建议

1. 可以进一步提取公共样式到主题配置中
2. 考虑使用 Ant Design 的主题定制功能
3. 可以将内联样式提取为 styled-components 或 CSS-in-JS
4. 优化响应式布局，更好地适配移动端
