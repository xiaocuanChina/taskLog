const fs = require('fs')
const path = require('path')

// 配置文件路径
const legacyConfigPath = path.join(__dirname, '..', 'tasksData', '.config')
const newConfigPath = path.join(__dirname, '..', 'tasksData', 'config.json')

console.log('开始迁移配置文件...')

try {
  // 检查旧配置文件是否存在
  if (!fs.existsSync(legacyConfigPath)) {
    console.log('未找到旧配置文件，无需迁移')
    process.exit(0)
  }

  // 读取base64编码的配置
  const base64Content = fs.readFileSync(legacyConfigPath, 'utf-8')
  
  // 解码为JSON
  const jsonContent = Buffer.from(base64Content, 'base64').toString('utf-8')
  
  // 验证JSON格式
  const config = JSON.parse(jsonContent)
  
  // 写入新配置文件（格式化输出）
  fs.writeFileSync(newConfigPath, JSON.stringify(config, null, 2), 'utf-8')
  
  console.log('✓ 配置迁移成功！')
  console.log(`  旧文件: ${legacyConfigPath}`)
  console.log(`  新文件: ${newConfigPath}`)
  console.log('\n配置内容:')
  console.log(JSON.stringify(config, null, 2))
  
  // 询问是否删除旧文件
  console.log('\n提示: 旧配置文件已保留，你可以手动删除它')
  
} catch (error) {
  console.error('✗ 配置迁移失败:', error.message)
  process.exit(1)
}
