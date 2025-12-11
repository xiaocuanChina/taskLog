/**
 * 通用设置组件
 */
import React from 'react'
import { Form, Radio, Space, Card, Divider } from 'antd'
// import { useState, useEffect } from 'react'
// import { ColorPicker, Typography } from 'antd'
// import { BgColorsOutlined } from '@ant-design/icons'
import styles from './SettingsModal.module.css'

// const { Text } = Typography

export default function GeneralSettings({ form, onFormChange }) {
  // 主题色设置暂时屏蔽，后续版本开放
  // // 使用 state 管理颜色值，确保可以实时更新
  // const [startColor, setStartColor] = useState('#667eea')
  // const [endColor, setEndColor] = useState('#764ba2')

  // // 初始化时从 form 获取颜色值
  // useEffect(() => {
  //   const themeColors = form.getFieldValue(['general', 'themeColors'])
  //   if (themeColors) {
  //     setStartColor(themeColors.startColor || '#667eea')
  //     setEndColor(themeColors.endColor || '#764ba2')
  //   }
  // }, [form])

  // // 处理起始色变化
  // const handleStartColorChange = (color) => {
  //   const colorHex = typeof color === 'string' ? color : color.toHexString()
  //   setStartColor(colorHex)

  //   // 更新表单值
  //   form.setFieldsValue({
  //     general: {
  //       ...form.getFieldValue('general'),
  //       themeColors: {
  //         startColor: colorHex,
  //         endColor: endColor
  //       }
  //     }
  //   })
  //   onFormChange()
  // }

  // // 处理结束色变化
  // const handleEndColorChange = (color) => {
  //   const colorHex = typeof color === 'string' ? color : color.toHexString()
  //   setEndColor(colorHex)

  //   // 更新表单值
  //   form.setFieldsValue({
  //     general: {
  //       ...form.getFieldValue('general'),
  //       themeColors: {
  //         startColor: startColor,
  //         endColor: colorHex
  //       }
  //     }
  //   })
  //   onFormChange()
  // }

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

      {/* 主题色设置暂时屏蔽，后续版本开放 */}
      {/* <Divider />

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
              <ColorPicker
                value={startColor}
                onChange={handleStartColorChange}
                showText
                disabledAlpha
              />
            </div>
            <div className={styles.colorPickerItem}>
              <Text>渐变结束色</Text>
              <ColorPicker
                value={endColor}
                onChange={handleEndColorChange}
                showText
                disabledAlpha
              />
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
      </Card> */}
    </div>
  )
}
