import React from 'react'
import { Form, Radio, Space, Card, Divider } from 'antd'
import { ColorPicker, Typography } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import styles from './SettingsModal.module.css'

const { Text } = Typography

export default function GeneralSettings({ form, onFormChange }) {
  // 使用 useWatch 实时追踪表单中的颜色值，用于预览效果
  const themeColors = Form.useWatch(['general', 'themeColors'], form)
  const startColor = themeColors?.startColor || '#667eea'
  const endColor = themeColors?.endColor || '#764ba2'

  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h3>通用设置</h3>
        <p className={styles.sectionDesc}>配置应用的基本行为</p>
      </div>

      <Form form={form} layout="vertical" onValuesChange={onFormChange}>
        <Divider />
        <Card className={styles.generalCard}>
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
        </Card>

        <Divider />

        <Card className={styles.generalCard}>
          <div className={styles.themeColorSection}>
            <div className={styles.themeColorHeader}>
              <BgColorsOutlined style={{ fontSize: 18, marginRight: 8, color: startColor }} />
              <Text strong>主题色设置</Text>
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              设置应用的主题渐变色，将应用于背景和按钮等元素（选择颜色后实时预览）
            </Text>

            <div className={styles.colorPickerRow}>
              <div className={styles.colorPickerItem}>
                <Text>渐变起始色</Text>
                <Form.Item
                  name={['general', 'themeColors', 'startColor']}
                  noStyle
                  getValueFromEvent={(color) => (typeof color === 'string' ? color : color.toHexString())}
                >
                  <ColorPicker
                    showText
                    format="hex"
                  />
                </Form.Item>
              </div>
              <div className={styles.colorPickerItem}>
                <Text>渐变结束色</Text>
                <Form.Item
                  name={['general', 'themeColors', 'endColor']}
                  noStyle
                  getValueFromEvent={(color) => (typeof color === 'string' ? color : color.toHexString())}
                >
                  <ColorPicker
                    showText
                    format="hex"
                  />
                </Form.Item>
              </div>
            </div>

            <div className={styles.gradientPreview}>
              <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>预览效果</Text>
              <div
                className={styles.gradientBar}
                style={{
                  background: `linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%)`
                }}
              />
            </div>
          </div>
        </Card>
      </Form>
    </div>
  )
}
