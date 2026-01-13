import React from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'antd/dist/reset.css'
import App from './App.jsx'
import './styles/common.module.css'
import { ToastProvider } from './context/ToastContext'

// 应用主题色到 CSS 变量
const applyThemeColors = (startColor, endColor) => {
  document.documentElement.style.setProperty('--theme-start-color', startColor)
  document.documentElement.style.setProperty('--theme-end-color', endColor)
  console.log('主题色已应用:', startColor, endColor)
}

// 在应用启动时立即加载并应用主题色
const initTheme = async () => {
  const defaultStartColor = '#667eea'
  const defaultEndColor = '#764ba2'

  try {
    // 等待 Electron API 准备好
    if (!window.electron?.config?.get) {
      console.log('Electron API 未准备好，使用默认主题色')
      return
    }

    const configStr = await window.electron.config.get()
    if (configStr) {
      const config = JSON.parse(configStr)
      const themeColors = config.general?.themeColors
      if (themeColors) {
        applyThemeColors(
          themeColors.startColor || defaultStartColor,
          themeColors.endColor || defaultEndColor
        )
      }
    }
  } catch (error) {
    console.error('初始化主题色失败:', error)
  }
}

// 先应用主题色，再渲染应用
initTheme().then(() => {
  createRoot(document.getElementById('root')).render(
    <ConfigProvider locale={zhCN}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ConfigProvider>
  )
})
