/**
 * Toast 提示组件
 * 
 * 功能说明:
 * - 用于显示操作反馈提示消息
 * - 支持成功、错误、信息三种类型
 * - 自动根据类型显示对应的图标和样式
 * - 使用 Ant Design Message API 实现
 * - 消息会自动消失,无需手动关闭
 * 
 * 使用场景:
 * - 操作成功提示(如创建、更新、删除成功)
 * - 错误提示(如操作失败、验证错误)
 * - 信息提示(如提醒、通知)
 */
import React, { useEffect } from 'react'
import { message } from 'antd'
export default function Toast({ show, message: msg, type }) {
  const [messageApi, contextHolder] = message.useMessage()

  useEffect(() => {
    if (show && msg) {
      const config = {
        content: msg,
        style: { marginTop: '50px' }
      }

      if (type === 'success') {
        messageApi.success(config)
      } else if (type === 'error') {
        messageApi.error(config)
      } else {
        messageApi.info(config)
      }
    }
  }, [show, msg, type, messageApi])

  return contextHolder
}
