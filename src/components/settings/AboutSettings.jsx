/**
 * 关于组件
 */
import { useState, useEffect } from 'react'
import { Button, Space, Tag, Progress } from 'antd'
import { GithubOutlined, RocketOutlined, UserOutlined, InfoCircleOutlined, CloudDownloadOutlined, SyncOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useToast } from '../../context/ToastContext'
import styles from './SettingsModal.module.css'

export default function AboutSettings() {
  const showToast = useToast()
  const [version, setVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState('idle') // idle, checking, available, downloading, downloaded, not-available, error
  const [updateInfo, setUpdateInfo] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    // 获取应用版本号
    window.electron.app.getVersion().then(v => setVersion(v))

    // 监听下载进度
    window.electron.updater.onDownloadProgress((progress) => {
      setDownloadProgress(Math.round(progress.percent))
    })

    // 监听下载完成
    window.electron.updater.onUpdateDownloaded((info) => {
      setUpdateStatus('downloaded')
      setUpdateInfo(info)
    })
  }, [])

  // 检查更新
  const handleCheckUpdate = async () => {
    setUpdateStatus('checking')
    try {
      const result = await window.electron.updater.checkForUpdates()
      if (result.hasUpdate) {
        setUpdateStatus('available')
        setUpdateInfo(result)
      } else {
        setUpdateStatus('not-available')
        showToast('当前已是最新版本', 'info')
      }
    } catch (err) {
      setUpdateStatus('error')
      showToast('检查更新失败: ' + (err.message || '未知错误'), 'error')
    }
  }

  // 下载更新
  const handleDownloadUpdate = async () => {
    setUpdateStatus('downloading')
    setDownloadProgress(0)
    try {
      await window.electron.updater.downloadUpdate()
    } catch (err) {
      setUpdateStatus('error')
      showToast('下载更新失败: ' + (err.message || '未知错误'), 'error')
    }
  }

  // 安装更新
  const handleInstallUpdate = () => {
    window.electron.updater.installUpdate()
  }

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
        {/* 版本信息卡片（含更新检查） */}
        <div className={styles.aboutInfoCard}>
          <div className={styles.infoCardIcon}>
            <InfoCircleOutlined />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>当前版本</div>
            <div className={styles.versionRow}>
              <div className={styles.infoCardValue}>
                {version || '加载中...'}
                {updateStatus === 'available' && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>新版本 {updateInfo?.version}</Tag>
                )}
                {updateStatus === 'downloaded' && (
                  <Tag color="green" style={{ marginLeft: 8 }}>已下载</Tag>
                )}
              </div>
              {/* 操作按钮：与版本号同一行 */}
              {(updateStatus === 'idle' || updateStatus === 'not-available' || updateStatus === 'error') && (
                <Button
                  size="small"
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={handleCheckUpdate}
                  loading={updateStatus === 'checking'}
                  className={styles.updateBtn}
                >
                  {updateStatus === 'checking' ? '检查中...' : '检查更新'}
                </Button>
              )}
              {updateStatus === 'available' && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={handleDownloadUpdate}
                  className={styles.updateBtn}
                >
                  下载更新
                </Button>
              )}
              {updateStatus === 'downloaded' && (
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={handleInstallUpdate}
                  className={styles.updateBtn}
                >
                  安装并重启
                </Button>
              )}
            </div>
            {/* 下载进度 */}
            {updateStatus === 'downloading' && (
              <div style={{ marginTop: 8 }}>
                <Progress percent={downloadProgress} size="small" status="active" />
              </div>
            )}
          </div>
        </div>

        {/* 作者信息卡片 */}
        <div className={styles.aboutInfoCard}>
          <div className={styles.infoCardIcon}>
            <UserOutlined />
          </div>
          <div className={styles.infoCardContent}>
            <div className={styles.infoCardLabel}>开发者</div>
            <div className={styles.infoCardValue}>小爨（cuàn）</div>
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
