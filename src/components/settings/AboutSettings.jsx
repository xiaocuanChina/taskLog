/**
 * 关于组件
 */
import React, { useState, useEffect } from 'react'
import { Divider, Button } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import styles from './SettingsModal.module.css'

export default function AboutSettings() {
  const [version, setVersion] = useState('')

  useEffect(() => {
    // 获取应用版本号
    window.electron.app.getVersion().then(v => setVersion(v))
  }, [])

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h3>关于 TaskLog</h3>
        <p className={styles.sectionDesc}>觉得用MD记录任务不太方便，于是TaskLog诞生了！！</p>
      </div>

      <Divider />

      <div className={styles.aboutContent}>
        <p><strong>版本：</strong>{version}</p>
        <p><strong>作者：</strong>小爨</p>
        <p><strong>描述：</strong>一个简洁高效的基础任务记录工具</p>
        <div style={{ textAlign: 'right', marginTop: 12 }}>
          <Button
            type="primary"
            icon={<GithubOutlined />}
            onClick={() => window.electron.shell.openExternal('https://github.com/xiaocuanChina/taskLog')}
          >
            GitHub
          </Button>
        </div>
      </div>
    </div>
  )
}
