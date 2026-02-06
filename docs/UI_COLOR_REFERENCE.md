# TaskLog UI 颜色参考指南

## 主色调系统

### 蓝色系（主要操作）
```css
主色: #3b82f6
深色: #2563eb
浅色背景: #eff6ff
边框: #dbeafe
文字: #1e40af
```
**用途**: 主要按钮、链接、待办任务标识

### 绿色系（成功/完成）
```css
主色: #10b981
深色: #059669
浅色背景: #f0fdf4
边框: #dcfce7
文字: #047857
```
**用途**: 完成按钮、已完成任务、成功状态

### 橙色系（待办/警告）
```css
主色: #f59e0b
深色: #d97706
浅色背景: #fef3c7
边框: #fde68a
文字: #b45309
```
**用途**: 待办任务标识、搁置功能、警告提示

### 紫色系（统计）
```css
主色: #a855f7
深色: #9333ea
浅色背景: #f3e8ff
边框: #e9d5ff
文字: #7e22ce
```
**用途**: 总任务数统计

### 灰色系（次要信息）
```css
深灰: #0f172a (标题)
中灰: #475569 (正文)
浅灰: #64748b (次要文字)
极浅灰: #94a3b8 (辅助文字)
背景灰: #f8fafc
边框灰: #e2e8f0
```
**用途**: 文字、边框、背景

## 组件配色方案

### 统计卡片
| 卡片类型 | 背景渐变 | 图标容器 | 数值颜色 |
|---------|---------|---------|---------|
| 今日新增 | `#eff6ff → #dbeafe` | `#3b82f6 → #2563eb` | `#1e40af` |
| 今日完成 | `#f0fdf4 → #dcfce7` | `#10b981 → #059669` | `#047857` |
| 待办任务 | `#fef3c7 → #fde68a` | `#f59e0b → #d97706` | `#b45309` |
| 总任务数 | `#f3e8ff → #e9d5ff` | `#a855f7 → #9333ea` | `#7e22ce` |
| 搁置任务 | `#fff7ed → #ffedd5` | `#fb923c → #f97316` | `#c2410c` |

### 按钮配色
| 按钮类型 | 背景 | 边框 | 文字 |
|---------|-----|-----|-----|
| 主要按钮 | `#3b82f6 → #2563eb` | `#3b82f6` | `#ffffff` |
| 成功按钮 | `#10b981 → #059669` | `#10b981` | `#ffffff` |
| 导出按钮 | `#10b981 → #059669` | `#10b981` | `#ffffff` |
| 默认按钮 | `#ffffff` | `#e2e8f0` | `#475569` |
| 回滚按钮 | `#f1f5f9` | `#cbd5e1` | `#475569` |

### 任务卡片
| 状态 | 背景渐变 | 左侧装饰条 | 边框 |
|-----|---------|-----------|-----|
| 待办 | `#ffffff → #f8fafc` | `#3b82f6` | `#e2e8f0` |
| 已完成 | `#f0fdf4 → #dcfce7` | `#10b981` | `#e2e8f0` |

### 模块分组
| 元素 | 颜色 |
|-----|-----|
| 背景 | `#ffffff` |
| 边框 | `#e2e8f0` |
| 待办徽章 | `#f59e0b` |
| 已完成徽章 | `#10b981` |

## 阴影系统

```css
/* 轻微阴影 - 卡片默认状态 */
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

/* 中等阴影 - 卡片悬停状态 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

/* 按钮阴影 - 蓝色 */
box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);

/* 按钮阴影 - 绿色 */
box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);

/* 图标容器阴影 */
box-shadow: 0 2px 8px rgba(主色, 0.25);
```

## 圆角系统

```css
/* 小圆角 - 标签、徽章 */
border-radius: 6px;

/* 中圆角 - 卡片、输入框 */
border-radius: 8px;

/* 大圆角 - 容器、面板 */
border-radius: 12px;

/* 图标容器 */
border-radius: 10px;
```

## 字体大小

```css
/* 标题 */
font-size: 24px; /* 页面标题 */
font-size: 16px; /* 卡片标题 */
font-size: 15px; /* 任务名称 */

/* 正文 */
font-size: 14px; /* 按钮文字 */
font-size: 13px; /* 备注内容 */
font-size: 12px; /* 标签、时间 */

/* 数值 */
font-size: 20px; /* 统计数值 */
```

## 字体粗细

```css
font-weight: 700; /* 数值、重要标题 */
font-weight: 600; /* 标题、按钮 */
font-weight: 500; /* 标签、次要标题 */
font-weight: 400; /* 正文 */
```

## 过渡动画

```css
/* 标准过渡 */
transition: all 0.2s ease;

/* 按钮点击 */
transform: scale(0.95);
transition: all 0.2s ease;

/* 卡片悬停 */
transform: translateY(-2px);
transition: all 0.2s;
```

## 使用示例

### 创建统计卡片
```jsx
<Card style={{
  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  border: '1px solid #bfdbfe',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(59, 130, 246, 0.1)'
}}>
  <div style={{
    width: 40,
    height: 40,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
  }}>
    <Icon />
  </div>
</Card>
```

### 创建主要按钮
```jsx
<Button style={{
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  borderColor: '#3b82f6',
  fontWeight: 600,
  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
  transition: 'all 0.2s'
}} />
```

### 创建任务卡片
```jsx
<Card style={{
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  border: '1px solid #e2e8f0',
  borderLeft: '4px solid #3b82f6',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.2s'
}} />
```
