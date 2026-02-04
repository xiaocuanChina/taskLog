# 配置文件说明

## 配置方式

项目支持三种配置方式，优先级从高到低：

### 1. 环境变量配置（最高优先级）

在项目根目录创建 `.env` 文件：

```bash
TASK_TYPES_CONFIG={"taskTypes":[{"name":"BUG","color":"#ff4d4f"}]}
```

适用场景：
- 不同环境需要不同配置
- CI/CD 构建时动态配置
- 临时测试配置

### 2. JSON配置文件（推荐）

编辑 `tasksData/config.json` 文件：

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

适用场景：
- 日常开发和维护
- 配置需要版本控制
- 配置内容较多

### 3. 默认配置（最低优先级）

如果以上两种方式都没有配置，系统会使用内置的默认配置。

## 配置项说明

### taskTypes

任务类型配置数组，每个类型包含：

- `name`: 类型名称（字符串）
- `color`: 类型颜色（十六进制颜色值，如 `#ff4d4f`）

## 从旧版本迁移

如果你的项目使用的是旧的base64编码配置（`.config`文件），可以运行以下命令自动迁移：

```bash
npm run config:migrate
```

迁移后会生成 `tasksData/config.json` 文件，旧的 `.config` 文件会保留，你可以手动删除。

## 注意事项

1. 修改配置文件后需要重启应用才能生效
2. 配置文件必须是有效的JSON格式
3. 颜色值建议使用十六进制格式（如 `#ff4d4f`）
4. 建议将 `config.json` 加入版本控制，将 `.env` 加入 `.gitignore`
