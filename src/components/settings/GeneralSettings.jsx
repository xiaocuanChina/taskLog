/**
 * 通用设置组件
 */
import React from 'react'
import { Form, Radio, Space, Card, Divider } from 'antd'
import styles from './SettingsModal.module.css'

export default function GeneralSettings({ form, onFormChange }) {
  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h3>通用设置</h3>
        <p className={styles.sectionDesc}>配置应用的基本行为</p>
      </div>
      
      <Divider />
      
      <Card className={styles.generalCard}>
        <Form form={form} layout="vertical" onValuesChange={onFormChange}>
          <Form.Item
            label="任务搜索范围"
            name={['general', 'searchScope']}
            tooltip="设置搜索任务时的匹配范围"
          >
            <Radio.Group>
              <Space>
                <Radio value="module">仅搜索模块名称</Radio>
                <Radio value="description">仅搜索任务描述</Radio>
                <Radio value="all">通用搜索（模块 + 描述）</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
