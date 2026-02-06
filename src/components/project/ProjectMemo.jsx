/**
 * 项目备忘组件（查看/编辑合一）
 * 
 * 功能说明:
 * - 统一的项目备忘查看和编辑组件
 * - 通过 mode 参数切换查看/编辑模式
 * - 查看模式：展示备忘内容，提供编辑入口
 * - 编辑模式：提供文本输入，支持 Ctrl+S 快捷保存
 * - 适配亮色/暗色主题
 * 
 * 使用场景:
 * - 查看项目备忘信息
 * - 编辑项目备忘内容
 * - 添加新的项目备忘
 */
import React from 'react'
import { Modal, Input, ConfigProvider, theme, Button, Empty } from 'antd'
import { FileTextOutlined, CloseOutlined, PushpinOutlined, EditOutlined } from '@ant-design/icons'
import styles from './ProjectMemo.module.css'
import { useThemeMode } from '../../hooks/useThemeMode'

const { TextArea } = Input

export default function ProjectMemo({ 
  show, 
  mode = 'view', // 'view' 或 'edit'
  memo, 
  projectName, 
  onMemoChange, 
  onConfirm, 
  onCancel,
  onEdit // 从查看模式切换到编辑模式
}) {
  const currentTheme = useThemeMode();
  const isDark = currentTheme === 'dark';

  // 处理键盘事件，支持 Ctrl+S 保存（仅编辑模式）
  const handleKeyDown = (e) => {
    if (mode === 'edit' && (e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      onConfirm()
    }
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgElevated: isDark ? '#1e293b' : '#ffffff',
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
        className={styles.projectMemoModal}
        width={680}
        closeIcon={null}
      >
        <div className={styles.container}>
          {/* 自定义头部 */}
          <div className={styles.header}>
            <div className={styles.modalTitle}>
              <FileTextOutlined />
              <span>项目备忘</span>
              <span className={styles.projectName}>· {projectName}</span>
            </div>
            <div className={styles.closeBtn} onClick={onCancel}>
              <CloseOutlined />
            </div>
          </div>

          <div className={styles.modalContent}>
            {mode === 'edit' ? (
              // 编辑模式
              <>
                <div className={styles.textareaWrapper}>
                  <TextArea
                    placeholder="记录项目的重要信息、注意事项、进度说明等..."
                    value={memo}
                    onChange={(e) => onMemoChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={12}
                    autoFocus
                    maxLength={2000}
                    showCount
                    className={styles.textarea}
                  />
                  <PushpinOutlined className={styles.pinIcon} />
                </div>
                
                <div className={styles.tips}>
                  <span className={styles.tipText}>⌨️ 按 Ctrl+S 快速保存</span>
                </div>
              </>
            ) : (
              // 查看模式
              <>
                {memo ? (
                  <div className={styles.memoContent}>
                    <div className={styles.memoText}>{memo}</div>
                    <PushpinOutlined className={styles.pinIcon} />
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <Empty
                      image={<FileTextOutlined className={styles.emptyIcon} />}
                      description={<span className={styles.emptyDesc}>暂无备忘内容</span>}
                    >
                      <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
                        添加备忘
                      </Button>
                    </Empty>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 自定义底部 */}
          <div className={styles.footer}>
            {mode === 'edit' ? (
              // 编辑模式按钮
              <>
                <Button onClick={onCancel}>取消</Button>
                <Button type="primary" onClick={onConfirm}>
                  确认保存
                </Button>
              </>
            ) : (
              // 查看模式按钮
              <>
                <Button onClick={onCancel}>关闭</Button>
                <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
                  编辑备忘
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>
    </ConfigProvider>
  )
}
