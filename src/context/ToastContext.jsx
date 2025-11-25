import React, { createContext, useContext, useCallback } from 'react'
import { message } from 'antd'

const ToastContext = createContext(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage()

  const showToast = useCallback((content, type = 'success') => {
    const config = {
      content,
      style: { marginTop: '50px' }
    }
    
    switch (type) {
      case 'success':
        messageApi.success(config)
        break
      case 'error':
        messageApi.error(config)
        break
      case 'info':
        messageApi.info(config)
        break
      case 'warning':
        messageApi.warning(config)
        break
      default:
        messageApi.open({ ...config, type })
    }
  }, [messageApi])

  return (
    <ToastContext.Provider value={showToast}>
      {contextHolder}
      {children}
    </ToastContext.Provider>
  )
}

