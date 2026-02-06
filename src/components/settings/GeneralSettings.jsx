import { Form, Radio, Space, Card, Tag } from 'antd'
import { ColorPicker, Typography } from 'antd'
import { BulbOutlined, FormatPainterOutlined } from '@ant-design/icons'
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
        <p className={styles.sectionDesc}>配置应用的基本行为和外观</p>
      </div>

      <Form form={form} layout="vertical" onValuesChange={onFormChange}>
        <Card className={styles.generalCard}>
          <Form.Item
            label={
              <Space>
                <BulbOutlined style={{ color: 'var(--text-tertiary)' }} />
                <span>界面主题</span>
              </Space>
            }
            name={['general', 'theme']}
            tooltip="选择应用的整体主题风格"
          >
            <Radio.Group>
              <Space style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Radio value="light">
                  <Space>
                    <span>浅色主题</span>
                    <Tag color="gold" style={{ fontSize: 11 }}>明亮</Tag>
                  </Space>
                </Radio>
                <Radio value="dark" disabled>
                  <Space>
                    <span>深色主题</span>
                    <Tag color="default" style={{ fontSize: 11 }}>优化中</Tag>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
        </Card>

        <Card className={styles.generalCard}>
          <div className={styles.themeColorSection}>
            <div className={styles.themeColorHeader}>
              <FormatPainterOutlined style={{ fontSize: 20, color: startColor, marginRight: 10 }} />
              <Text strong style={{ fontSize: 15 }}>主题色设置</Text>
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontSize: 13, lineHeight: 1.6 }}>
              自定义应用的主题渐变色，将应用于背景、按钮等界面元素
            </Text>

            <div className={styles.colorPickerRow}>
              <div className={styles.colorPickerItem}>
                <span>渐变起始色</span>
                <Form.Item
                  name={['general', 'themeColors', 'startColor']}
                  noStyle
                  getValueFromEvent={(color) => (typeof color === 'string' ? color : color.toHexString())}
                >
                  <ColorPicker
                    showText
                    format="hex"
                    size="large"
                    presets={[
                      {
                        label: '推荐色',
                        colors: [
                          '#667eea',
                          '#764ba2',
                          '#f093fb',
                          '#4facfe',
                          '#43e97b',
                          '#fa709a',
                        ],
                      },
                    ]}
                  />
                </Form.Item>
              </div>
              <div className={styles.colorPickerItem}>
                <span>渐变结束色</span>
                <Form.Item
                  name={['general', 'themeColors', 'endColor']}
                  noStyle
                  getValueFromEvent={(color) => (typeof color === 'string' ? color : color.toHexString())}
                >
                  <ColorPicker
                    showText
                    format="hex"
                    size="large"
                    presets={[
                      {
                        label: '推荐色',
                        colors: [
                          '#764ba2',
                          '#667eea',
                          '#4facfe',
                          '#00f2fe',
                          '#38f9d7',
                          '#fee140',
                        ],
                      },
                    ]}
                  />
                </Form.Item>
              </div>
            </div>

            <div className={styles.gradientPreview}>
              <Text type="secondary" style={{ marginBottom: 12, display: 'block', fontSize: 13, fontWeight: 500 }}>
                实时预览
              </Text>
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
