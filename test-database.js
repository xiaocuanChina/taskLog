/**
 * 数据库功能测试脚本
 * 运行方式: node test-database.js
 */

const Database = require('./electron/database')
const fs = require('fs')
const path = require('path')

async function testDatabase() {
  console.log('开始测试数据库功能...\n')

  // 创建测试数据库
  const testDbPath = path.join(__dirname, 'test.db')
  
  // 删除旧的测试数据库
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
    console.log('✓ 清理旧测试数据库')
  }

  const db = new Database(testDbPath)
  await db.init()
  console.log('✓ 数据库初始化成功\n')

  try {
    // 测试项目管理
    console.log('=== 测试项目管理 ===')
    const project1 = db.addProject({
      id: 'proj-1',
      name: '测试项目1',
      memo: '这是一个测试项目',
      createdAt: new Date().toISOString()
    })
    console.log('✓ 添加项目:', project1.name)

    const projects = db.getProjects()
    console.log('✓ 获取项目列表:', projects.length, '个项目')

    db.updateProject('proj-1', {
      name: '测试项目1（已更新）',
      updatedAt: new Date().toISOString()
    })
    console.log('✓ 更新项目成功\n')

    // 测试模块管理
    console.log('=== 测试模块管理 ===')
    const module1 = db.addModule({
      id: 'mod-1',
      projectId: 'proj-1',
      name: '前端模块',
      order: 0,
      deleted: false,
      createdAt: new Date().toISOString()
    })
    console.log('✓ 添加模块:', module1.name)

    const module2 = db.addModule({
      id: 'mod-2',
      projectId: 'proj-1',
      name: '后端模块',
      order: 1,
      deleted: false,
      createdAt: new Date().toISOString()
    })
    console.log('✓ 添加模块:', module2.name)

    const modules = db.getModules('proj-1')
    console.log('✓ 获取模块列表:', modules.length, '个模块')

    db.deleteModule('mod-2')
    const activeModules = db.getModules('proj-1', false)
    console.log('✓ 逻辑删除模块后，活跃模块数:', activeModules.length)

    db.restoreModule('mod-2')
    const restoredModules = db.getModules('proj-1', false)
    console.log('✓ 恢复模块后，活跃模块数:', restoredModules.length, '\n')

    // 测试任务管理
    console.log('=== 测试任务管理 ===')
    const task1 = db.addTask({
      id: 'task-1',
      projectId: 'proj-1',
      module: '前端模块',
      name: '实现登录功能',
      type: 'BUG',
      initiator: '张三',
      remark: '需要支持手机号登录',
      images: [],
      codeBlock: { enabled: false, language: 'javascript', code: '' },
      checkItems: { enabled: false, mode: 'multiple', items: [] },
      completed: false,
      shelved: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      shelvedAt: null
    })
    console.log('✓ 添加任务:', task1.name)

    const task2 = db.addTask({
      id: 'task-2',
      projectId: 'proj-1',
      module: '后端模块',
      name: '优化数据库查询',
      type: '优化',
      initiator: '李四',
      remark: '添加索引提升性能',
      images: [],
      codeBlock: { enabled: false, language: 'javascript', code: '' },
      checkItems: { enabled: false, mode: 'multiple', items: [] },
      completed: false,
      shelved: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
      shelvedAt: null
    })
    console.log('✓ 添加任务:', task2.name)

    const tasks = db.getTasks('proj-1')
    console.log('✓ 获取任务列表:', tasks.length, '个任务')

    db.updateTask('task-1', {
      completed: true,
      completedAt: new Date().toISOString()
    })
    console.log('✓ 标记任务完成')

    db.updateTask('task-2', {
      shelved: true,
      shelvedAt: new Date().toISOString()
    })
    console.log('✓ 搁置任务\n')

    // 测试配置管理
    console.log('=== 测试配置管理 ===')
    const config = {
      general: {
        theme: 'light',
        themeColors: {
          startColor: '#667eea',
          endColor: '#764ba2'
        }
      },
      taskTypes: [
        { name: 'BUG', color: '#ff4d4f' },
        { name: '代办', color: '#1890ff' }
      ]
    }
    db.saveConfig('app_config', JSON.stringify(config))
    console.log('✓ 保存配置成功')

    const savedConfig = db.getConfig('app_config')
    console.log('✓ 读取配置成功:', savedConfig ? 'OK' : 'FAIL', '\n')

    // 测试数据统计
    console.log('=== 测试数据统计 ===')
    const taskCount = db.getTaskCountByModule('proj-1', '前端模块')
    console.log('✓ 前端模块任务数:', taskCount)

    const pendingCount = db.getPendingTaskCountByModule('proj-1', '前端模块')
    console.log('✓ 前端模块未完成任务数:', pendingCount, '\n')

    // 测试数据导出
    console.log('=== 测试数据导出 ===')
    const exportData = db.exportToJSON()
    console.log('✓ 导出数据:')
    console.log('  - 项目数:', exportData.projects.length)
    console.log('  - 模块数:', exportData.modules.length)
    console.log('  - 任务数:', exportData.tasks.length)
    console.log('  - 配置:', exportData.config ? 'OK' : 'FAIL', '\n')

    // 测试数据迁移
    console.log('=== 测试数据迁移 ===')
    const migrateData = {
      projects: [
        {
          id: 'proj-2',
          name: '迁移项目',
          memo: '从JSON迁移',
          createdAt: new Date().toISOString()
        }
      ],
      modules: [
        {
          id: 'mod-3',
          projectId: 'proj-2',
          name: '迁移模块',
          deleted: false,
          createdAt: new Date().toISOString()
        }
      ],
      tasks: [
        {
          id: 'task-3',
          projectId: 'proj-2',
          module: '迁移模块',
          name: '迁移任务',
          type: '代办',
          initiator: '系统',
          remark: '',
          images: [],
          codeBlock: { enabled: false, language: 'javascript', code: '' },
          checkItems: { enabled: false, mode: 'multiple', items: [] },
          completed: false,
          createdAt: new Date().toISOString()
        }
      ],
      config: config
    }
    db.migrateFromJSON(migrateData)
    console.log('✓ 数据迁移成功')

    const allProjects = db.getProjects()
    console.log('✓ 迁移后项目总数:', allProjects.length, '\n')

    console.log('=== 所有测试通过 ✓ ===')

  } catch (error) {
    console.error('✗ 测试失败:', error)
  } finally {
    // 关闭数据库
    db.close()
    console.log('\n✓ 数据库已关闭')

    // 清理测试文件
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
      console.log('✓ 清理测试文件')
    }
  }
}

// 运行测试
testDatabase().catch(console.error)
