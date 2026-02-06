/**
 * 项目创建/编辑模态框组件
 * 
 * 功能说明:
 * - 用于创建新项目或编辑现有项目
 * - 提供项目名称输入框
 * - 支持回车键快速确认
 * - 根据 isEdit 参数区分创建和编辑模式
 * - 使用 Ant Design Modal 和 Form 组件实现
 * - 适配亮色/暗色主题
 * 
 * 使用场景:
 * - 在项目选择视图中创建新项目
 * - 编辑现有项目的名称
 */
import React from 'react'
import { Modal, Input, Form, ConfigProvider, theme, Button } from 'antd'
import { FolderAddOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons'
import styles from './ProjectModal.module.css'
import { useThemeMode } from '../../hooks/useThemeMode'

export default function ProjectModal({ show, isEdit, projectName, onNameChange, onConfirm, onCancel }) {
  const currentTheme = useThemeMode();
  const isDark = currentTheme === 'dark';

  // 处理键盘事件，支持 Ctrl+S 保存
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgElevated: isDark ? '#1e293b' : '#ffffff', // 使用主题定义的 --ant-modal-bg
          colorText: isDark ? '#f8fafc' : 'rgba(0, 0, 0, 0.88)',
        },
        components: {
          Modal: {
            contentBg: isDark ? '#1e293b' : '#ffffff',
          },
          Input: {
            colorBgContainer: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
            colorTextPlaceholder: isDark ? 'rgba(255, 255, 255, 0.4)' : undefined,
            colorBorder: isDark ? 'rgba(255, 255, 255, 0.1)' : '#d9d9d9',
          }
        }
      }}
    >
      <Modal
        open={show}
        title={null}
        footer={null}
        onCancel={onCancel}
        centered
        className={styles.projectModal}
        width={520}
        closeIcon={null} // 隐藏默认关闭按钮，我们自己画
      >
        <div className={styles.container}>
          {/* 自定义头部 */}
          <div className={styles.header}>
            <div className={styles.modalTitle}>
              {isEdit ? <EditOutlined /> : <FolderAddOutlined />}
              <span>{isEdit ? '编辑项目' : '创建新项目'}</span>
            </div>
            <div className={styles.closeBtn} onClick={onCancel}>
              <CloseOutlined />
            </div>
          </div>

          <div className={styles.modalContent}>
            <Form layout="vertical">
              <Form.Item 
                label="项目名称" 
                required
                className={styles.formItem}
              >
                <Input
                  placeholder="请输入项目名称，例如：网站重构项目"
                  value={projectName}
                  onChange={(e) => onNameChange(e.target.value)}
                  onPressEnter={onConfirm}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  size="large"
                  maxLength={50}
                  showCount
                  className={styles.input}
                />
              </Form.Item>
              
              <div className={styles.tips}>
                <div className={styles.tipItem}>
                  💡 <span>按 Enter 快速创建</span>
                </div>
                <div className={styles.tipItem}>
                  ⌨️ <span>按 Ctrl+S 保存</span>
                </div>
              </div>
            </Form>
          </div>

          {/* 自定义底部 */}
          <div className={styles.footer}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" onClick={onConfirm}>
              {isEdit ? '确认更新' : '确认创建'}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}
