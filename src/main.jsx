import React from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'antd/dist/reset.css'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext'

createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={zhCN}>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ConfigProvider>
)
