# 快速启动指南

## 🚀 立即开始

### 1. 安装依赖
```bash
npm install
```

### 2. 开发模式运行
```bash
npm run dev
```

### 3. 构建生产版本
```bash
npm run build
npm run electron:build
```

## 📦 数据存储

项目现在使用 **SQLite 数据库** 存储数据：

- **数据库文件**: `%APPDATA%/task-log/tasksData/tasklog.db`
- **图片文件**: `%APPDATA%/task-log/tasksData/images/`

## 🔄 从旧版本升级

如果你之前使用的是 JSON 文件存储版本：

1. **无需手动操作** - 应用会自动检测并迁移数据
2. **旧文件备份** - 迁移后，旧的 JSON 文件会被重命名为 `.backup` 后缀
3. **数据安全** - 建议在升级前先使用"导出数据"功能备份

## 📊 数据管理

### 导出数据
1. 打开应用
2. 进入"设置" → "隐私与数据"
3. 点击"导出数据"
4. 选择保存位置

### 导入数据
1. 打开应用
2. 进入"设置" → "隐私与数据"
3. 点击"导入数据"
4. 选择备份文件（.zip 或 .json）

## 🧪 测试数据库

运行测试脚本验证数据库功能：

```bash
node test-database.js
```

## 📖 更多文档

- [配置指南](./CONFIG_GUIDE.md) - 应用配置说明
- [项目开发文档](./project-docs/) - 数据库迁移、代码重构等技术文档
- [返回项目主页](../README.md)

## ❓ 常见问题

### Q: 数据会丢失吗？
A: 不会。迁移过程会保留所有数据，并且旧文件会被备份。

### Q: 如何恢复数据？
A: 使用"导入数据"功能，选择之前导出的备份文件。

### Q: 数据库文件在哪里？
A: Windows: `%APPDATA%/task-log/tasksData/tasklog.db`

### Q: 可以手动编辑数据库吗？
A: 可以，但不建议。推荐使用应用内的功能进行数据管理。

## 🆘 需要帮助？

如果遇到问题：
1. 查看控制台错误日志
2. 阅读 [DATABASE_MIGRATION.md](./project-docs/DATABASE_MIGRATION.md) 的故障排查部分
3. 提交 Issue 到项目仓库

---

**祝使用愉快！** 🎉
