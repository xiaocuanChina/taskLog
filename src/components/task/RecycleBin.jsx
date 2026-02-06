import React from 'react'
import { Button, Tooltip, Popconfirm } from 'antd'
import { LogoutOutlined, FolderOutlined, DeleteOutlined } from '@ant-design/icons'
import styles from './RecycleBin.module.css'

export default function RecycleBin({ modules, onRestore }) {
  if (!modules || modules.length === 0) return null
  
  return (
    <div className={styles.recycleBin}>
      <div className={styles.recycleBinList}>
        {modules.map(module => (
          <div key={module.id} className={styles.recycleItem}>
            <div className={styles.recycleItemContent}>
              {/* 模块图标 - 已删除状态 */}
              <div className={styles.recycleIcon}>
                <FolderOutlined />
              </div>

              {/* 模块信息 */}
              <div className={styles.recycleInfo}>
                <div className={styles.recycleName} title={module.name}>
                  {module.name}
                </div>
                <div className={styles.recycleHint}>
                  已移入回收站
                </div>
              </div>

              {/* 操作按钮 */}
              <div className={styles.recycleActions}>
                <Popconfirm
                  title="确认恢复"
                  description={`确定要恢复模块 "${module.name}" 吗？`}
                  onConfirm={() => onRestore(module.id)}
                  okText="确认"
                  cancelText="取消"
                >
                  <Tooltip title="恢复模块">
                    <Button
                      type="primary"
                      size="small"
                      icon={<LogoutOutlined />}
                      className={styles.restoreBtn}
                    >
                      恢复
                    </Button>
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

