/**
 * 关于组件
 */
import { useState, useEffect } from 'react'
import { Button, Space, Tag } from 'antd'
import { GithubOutlined, RocketOutlined, UserOutlined, InfoCircleOutlined } from '@ant-design/icons'
import styles from './SettingsModal.module.css'

export default function AboutSettings() {
  const [version, setVersion] = useState('')

  useEffect(() => {
    // 获取应用版本号
    window.electron.app.getVersion().then(v => setVersion(v))
  }, [])

  return (
    <div className={styles.contentSection}>
      {/* 头部区域 */}
      <div className={styles.headerTop}>
        <div className={styles.headerIcon}>
          <RocketOutlined />
        </div>
        <div className={styles.headerContent}>
          <h3>关于 TaskLog</h3>
          <p className={styles.sectionDesc}>觉得用 MD 记录任务不太方便，于是 TaskLog 诞生了！</p>
        </div>
      </div>

      {/* 信息卡片区域 */}
      <div className={styles.aboutInfoGrid}>
        {/* 版本信息卡片 */}
        <div className={styles.aboutInfoCard}>
          <div className={styles.infoCardIcon}>
            <InfoCircleOutlined />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>当前版本</div>
            <div className={styles.infoCardValue}>
              {version || '加载中...'}
            </div>
          </div>
        </div>

        {/* 作者信息卡片 */}
        <div className={styles.aboutInfoCard}>
          <div className={styles.infoCardIcon}>
            <UserOutlined />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>开发者</div>
            <div className={styles.infoCardValue}>小爨</div>
          </div>
        </div>
      </div>

      {/* 描述卡片 */}
      <div className={styles.aboutDescCard}>
        <h4>产品介绍</h4>
        <p>
          TaskLog 是一个简洁高效的任务记录工具，专为提升个人和团队的工作效率而设计。
          它提供了直观的任务管理界面，支持项目分组、任务分类、进度追踪等功能，
          让你的任务管理变得更加轻松愉快。
        </p>
        <div className={styles.featureList}>
          <div className={styles.featureItem}>✨ 简洁直观的界面设计</div>
          <div className={styles.featureItem}>🚀 高效的任务管理体验</div>
          <div className={styles.featureItem}>📊 完善的数据统计功能</div>
          <div className={styles.featureItem}>🎨 可自定义的主题配色</div>
        </div>
      </div>

      {/* 操作按钮区域 */}
      <div className={styles.aboutActions}>
        <Button
          type="primary"
          icon={<GithubOutlined />}
          onClick={() => window.electron.shell.openExternal('https://github.com/xiaocuanChina/taskLog')}
          size="large"
          className={styles.githubButton}
        >
          访问 GitHub
        </Button>
      </div>
    </div>
  )
}
