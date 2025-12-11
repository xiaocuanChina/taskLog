/**
 * 配置管理模块
 * 
 * 功能说明:
 * - 管理应用配置的读取和保存
 * - 使用 Base64 编码存储配置（简单混淆，防止直接查看）
 * - 提供默认配置和配置验证
 * - 通过 Electron API 与本地文件系统交互
 */

// 默认配置
const DEFAULT_CONFIG = {
  general: {
    searchScope: 'all', // 'module' | 'description' | 'all'
    themeColors: {
      startColor: '#667eea',  // 渐变起始色
      endColor: '#764ba2'     // 渐变结束色
    }
  },
  taskTypes: [
    { name: 'BUG', color: '#ff4d4f' },
    { name: '代办', color: '#1890ff' },
    { name: '优化', color: '#52c41a' },
    { name: '其他', color: '#faad14' }
  ]
}

/**
 * 获取配置
 */
export async function getConfig() {
  try {
    const configStr = await window.electron?.config?.get()
    if (!configStr) {
      return DEFAULT_CONFIG
    }

    // 直接解析 JSON（主进程已经返回 JSON 字符串）
    const config = JSON.parse(configStr)

    // 验证配置结构
    if (!config.taskTypes || !Array.isArray(config.taskTypes)) {
      return DEFAULT_CONFIG
    }

    // 确保通用设置存在
    if (!config.general) {
      config.general = DEFAULT_CONFIG.general
    }

    // 确保 themeColors 存在
    if (!config.general.themeColors) {
      config.general.themeColors = DEFAULT_CONFIG.general.themeColors
    }

    return config
  } catch (error) {
    console.error('读取配置失败:', error)
    return DEFAULT_CONFIG
  }
}

/**
 * 保存配置
 */
export async function saveConfig(config) {
  try {
    // 验证配置
    if (!config.taskTypes || !Array.isArray(config.taskTypes)) {
      throw new Error('配置格式错误')
    }

    // 确保通用设置存在
    if (!config.general) {
      config.general = DEFAULT_CONFIG.general
    }

    // 确保 themeColors 存在
    if (!config.general.themeColors) {
      config.general.themeColors = DEFAULT_CONFIG.general.themeColors
    }

    // 直接保存 JSON 字符串（主进程会处理存储）
    const configStr = JSON.stringify(config)
    console.log('保存配置:', config.general?.themeColors)

    const result = await window.electron?.config?.save(configStr)
    console.log('配置保存结果:', result)
    return true
  } catch (error) {
    console.error('保存配置失败:', error)
    return false
  }
}

/**
 * 重置为默认配置
 */
export async function resetConfig() {
  return await saveConfig(DEFAULT_CONFIG)
}

/**
 * 获取任务类型列表
 */
export async function getTaskTypes() {
  const config = await getConfig()
  return config.taskTypes
}

/**
 * 获取任务类型颜色
 */
export async function getTaskTypeColor(typeName) {
  const taskTypes = await getTaskTypes()
  const type = taskTypes.find(t => t.name === typeName)
  return type?.color || '#1890ff'
}
