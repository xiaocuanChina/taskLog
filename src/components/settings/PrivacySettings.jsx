/**
 * 隐私设置组件
 */
import React from 'react'
import { Button, Space, Card, Divider, Alert, Popconfirm } from 'antd'
import { ExportOutlined, ImportOutlined } from '@ant-design/icons'
import styles from './SettingsModal.module.css'

export default function PrivacySettings({
  exportLoading,
  importLoading,
  onExportData,
  onImportData
}) {
  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h3>数据管理</h3>
        <p className={styles.sectionDesc}>导出和导入您的数据</p>
      </div>
      
      <Divider />
      
      <Alert
        title="数据说明：导出的数据包含数据库文件、JSON 格式数据、所有图片附件和恢复说明。导入时会自动选择最优恢复方式。导入数据将覆盖当前所有数据，请谨慎操作。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Card size="small">
          <div className={styles.privacyAction}>
            <div>
              <h4>导出数据</h4>
              <p className={styles.actionDesc}>导出数据库文件、JSON 数据和图片为 ZIP 压缩包</p>
            </div>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={onExportData}
              loading={exportLoading}
            >
              导出数据
            </Button>
          </div>
        </Card>
        
        <Card size="small">
          <div className={styles.privacyAction}>
            <div>
              <h4>导入数据</h4>
              <p className={styles.actionDesc}>从 ZIP 压缩包导入（自动识别数据库或 JSON 格式）</p>
            </div>
            <Popconfirm
              title="确定要导入数据吗？"
              description="此操作将覆盖当前所有数据，建议先导出备份"
              onConfirm={onImportData}
              okText="确定"
              cancelText="取消"
            >
              <Button
                icon={<ImportOutlined />}
                loading={importLoading}
                danger
              >
                导入数据
              </Button>
            </Popconfirm>
          </div>
        </Card>
      </Space>
    </div>
  )
}
