# 更新说明 - 项目选择页面优化

## 📅 更新日期
2024年2月5日

## 🎯 本次更新内容

### 1. ✅ 修复项目任务数据显示问题

**问题描述：**
- 项目卡片无法显示任务统计信息
- 进度条显示为 0%
- 无法看到已完成和进行中的任务数量

**解决方案：**
- 修改 `electron/main.js` 中的 `projects:list` 处理器
- 为每个项目添加完整的任务列表数据
- 前端可以基于任务数据计算统计信息

**修改文件：**
- `electron/main.js` - 第174-183行

**代码变更：**
```javascript
// 修改前
ipcMain.handle('projects:list', () => {
  return db.getProjects()
})

// 修改后
ipcMain.handle('projects:list', () => {
  const projects = db.getProjects()
  // 为每个项目添加任务统计信息
  return projects.map(project => {
    const tasks = db.getTasks(project.id)
    return {
      ...project,
      tasks: tasks // 添加任务列表，用于前端统计
    }
  })
})
```

### 2. ✅ 恢复拖拽排序功能

**功能说明：**
- 在"自定义排序"模式下支持拖拽调整项目顺序
- 拖拽手柄在卡片悬停时显示
- 其他排序模式下禁用拖拽功能

**实现细节：**
- 使用 `@dnd-kit/core` 和 `@dnd-kit/sortable` 实现拖拽
- 创建 `SortableProjectCard` 组件包装项目卡片
- 添加拖拽手柄按钮（三横线图标）
- 拖拽时卡片半透明显示

**修改文件：**
- `src/components/project/ProjectSelectView.jsx`
- `src/components/project/ProjectSelectView.module.css`

**新增功能：**
- 排序选项中添加"自定义排序（拖拽）"
- 只有在自定义排序模式下才显示拖拽手柄
- 拖拽手柄悬停时显示，点击不会触发进入项目

**使用方法：**
1. 在左侧边栏的"排序方式"中选择"自定义排序（拖拽）"
2. 悬停在项目卡片上，会看到拖拽手柄（三横线图标）
3. 按住拖拽手柄拖动卡片到目标位置
4. 松开鼠标完成排序

### 3. ✅ 添加主题切换设置

**功能说明：**
- 在设置页面添加"界面主题"选项
- 支持深色主题和浅色主题切换
- 当前版本默认使用深色主题

**实现细节：**
- 在 `GeneralSettings.jsx` 中添加主题选择单选框
- 在配置管理器中添加 `theme` 字段
- 默认值为 `'dark'`（深色主题）
- 浅色主题标记为"即将推出"

**修改文件：**
- `src/components/settings/GeneralSettings.jsx`
- `src/utils/configManager.js`

**配置结构：**
```javascript
{
  general: {
    searchScope: 'all',
    theme: 'dark', // 新增字段
    themeColors: {
      startColor: '#667eea',
      endColor: '#764ba2'
    }
  }
}
```

**使用方法：**
1. 打开设置页面（点击右上角齿轮图标）
2. 进入"通用设置"标签
3. 在"界面主题"部分选择主题
4. 当前仅支持深色主题，浅色主题即将推出

## 📊 技术细节

### 拖拽排序实现

**使用的库：**
- `@dnd-kit/core` - 核心拖拽功能
- `@dnd-kit/sortable` - 排序功能
- `@dnd-kit/utilities` - 工具函数（CSS 转换）

**核心代码：**
```jsx
// 配置拖拽传感器
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 拖动8px后才激活,避免误触
    },
  })
)

// 处理拖拽结束
const handleDragEnd = (event) => {
  const { active, over } = event
  if (over && active.id !== over.id) {
    const oldIndex = filteredAndSortedProjects.findIndex(p => p.id === active.id)
    const newIndex = filteredAndSortedProjects.findIndex(p => p.id === over.id)
    const newProjects = arrayMove(filteredAndSortedProjects, oldIndex, newIndex)
    onProjectsReorder(newProjects)
  }
}
```

**SortableProjectCard 组件：**
```jsx
function SortableProjectCard({ project, stats, statusColor, sortBy, onSelectProject, getProjectMenu }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: project.id,
    disabled: sortBy !== 'custom' // 只有在自定义排序时才允许拖拽
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* 卡片内容 */}
      {sortBy === 'custom' && (
        <Button {...listeners} /> // 拖拽手柄
      )}
    </div>
  )
}
```

### 性能优化

**数据获取优化：**
- 在后端一次性获取所有项目和任务数据
- 避免前端多次调用 API
- 减少 IPC 通信次数

**计算优化：**
- 使用 `useMemo` 缓存过滤和排序结果
- 只在依赖项变化时重新计算
- 避免不必要的重渲染

**拖拽优化：**
- 设置激活距离（8px），避免误触
- 拖拽时使用 CSS transform，性能更好
- 禁用非自定义排序模式下的拖拽

## 🐛 已知问题

### 1. 浅色主题未实现
- **状态：** 计划中
- **说明：** 当前仅支持深色主题，浅色主题需要重新设计样式
- **预计：** 下个版本实现

### 2. 拖拽排序不持久化
- **状态：** 部分实现
- **说明：** 前端可以拖拽排序，但刷新后会恢复原顺序
- **原因：** 数据库表没有 `order` 字段
- **临时方案：** 前端保持排序状态
- **长期方案：** 数据库添加 `order` 字段并持久化

### 3. 列表视图不支持拖拽
- **状态：** 设计限制
- **说明：** 当前仅网格视图支持拖拽排序
- **原因：** 列表视图使用不同的布局策略
- **计划：** 未来版本可能支持

## 📝 使用建议

### 排序功能使用建议

1. **日常使用：** 选择"最近更新"，自动按活跃度排序
2. **查找项目：** 选择"按名称"，字母顺序查找
3. **关注进度：** 选择"按进度"，优先显示高进度项目
4. **自定义顺序：** 选择"自定义排序"，手动调整重要项目位置

### 主题设置建议

1. **长时间使用：** 推荐深色主题，减少眼睛疲劳
2. **白天使用：** 等待浅色主题上线
3. **个性化：** 调整主题渐变色，打造专属配色

### 性能优化建议

1. **项目数量：** 建议控制在 50 个以内，超过建议归档
2. **搜索使用：** 项目多时使用搜索功能快速定位
3. **视图切换：** 项目多时使用列表视图，浏览更快

## 🔄 升级指南

### 从旧版升级

1. **备份数据：** 升级前建议备份 `tasksData.db` 文件
2. **清除缓存：** 如遇问题，尝试清除浏览器缓存
3. **重启应用：** 升级后重启应用以加载新配置

### 配置迁移

- 旧版配置会自动迁移
- 新增的 `theme` 字段会使用默认值 `'dark'`
- 无需手动修改配置文件

## 🚀 下个版本计划

### 功能规划

- [ ] 浅色主题实现
- [ ] 拖拽排序持久化
- [ ] 列表视图支持拖拽
- [ ] 项目标签和分类
- [ ] 项目收藏/置顶
- [ ] 项目归档功能
- [ ] 批量操作
- [ ] 快捷键支持

### 性能优化

- [ ] 虚拟滚动（项目超过100个时）
- [ ] 懒加载任务数据
- [ ] 图片懒加载
- [ ] 搜索防抖优化

## 📞 反馈与支持

如遇到问题或有建议，请通过以下方式反馈：
- 在项目中创建 Issue
- 联系开发团队

---

**更新完成！** 🎉

感谢使用 TaskLog，祝你工作愉快！
