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
        title="数据说明"
        description="导出的数据包含：配置信息、所有项目、模块和任务数据。导入数据将覆盖当前所有数据，请谨慎操作。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <div className={styles.privacyAction}>
            <div>
              <h4>导出数据</h4>
              <p className={styles.actionDesc}>将所有配置、项目和任务数据导出为 JSON 文件</p>
            </div>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={onExportData}
              loading={exportLoading}
              size="large"
            >
              导出数据
            </Button>
          </div>
        </Card>
        
        <Card>
          <div className={styles.privacyAction}>
            <div>
              <h4>导入数据</h4>
              <p className={styles.actionDesc}>从 JSON 文件导入数据（将覆盖当前数据）</p>
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
                size="large"
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
