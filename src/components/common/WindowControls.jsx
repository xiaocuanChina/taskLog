/**
 * 窗口控制栏组件
 * 
 * 功能说明:
 * - 用于 Electron 应用的自定义窗口控制
 * - 显示应用图标和标题
 * - 提供最小化、最大化、关闭按钮
 * - 通过 Electron API 控制窗口行为
 * - 固定在窗口顶部,支持拖拽移动窗口
 * 
 * 使用场景:
 * - 所有视图的顶部窗口控制
 * - 替代系统默认的窗口标题栏
 */
import React, { useState } from 'react'
import { SettingOutlined } from '@ant-design/icons'
import SettingsModal from '../settings/SettingsModal'
import styles from './WindowControls.module.css'
import appIcon from '../../assets/icon.png'

export default function WindowControls({ title, onConfigChange }) {
  const [settingsVisible, setSettingsVisible] = useState(false)

  const handleSettingsClose = (needRefresh) => {
    setSettingsVisible(false)
    if (needRefresh && onConfigChange) {
      onConfigChange()
    }
  }

  return (
    <div className={styles.windowControls}>
      <div className={styles.windowTitleBar}>
        <div className={styles.windowTitle}>
          <img src={appIcon} alt="应用图标" className={styles.appIcon} />
          <span>{title}</span>
        </div>
        <div className={styles.windowButtons}>
          <button 
            className={`${styles.windowBtn} ${styles.windowBtnSettings}`}
            onClick={() => setSettingsVisible(true)}
            title="设置"
          >
            <SettingOutlined style={{ fontSize: '14px' }} />
          </button>
          <button 
            className={`${styles.windowBtn} ${styles.windowBtnMinimize}`}
            onClick={() => window.electron?.window?.minimize()}
            title="最小化"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button 
            className={`${styles.windowBtn} ${styles.windowBtnMaximize}`}
            onClick={() => window.electron?.window?.maximize()}
            title="最大化"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button 
            className={`${styles.windowBtn} ${styles.windowBtnClose}`}
            onClick={() => window.electron?.window?.close()}
            title="关闭"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </div>
      
      <SettingsModal 
        visible={settingsVisible} 
        onClose={handleSettingsClose}
      />
    </div>
  )
}
