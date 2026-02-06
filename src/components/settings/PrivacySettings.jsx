/**
 * 隐私设置组件
 */
import { Button, Card, Typography, Space } from 'antd'
import { 
  ExportOutlined, 
  ImportOutlined, 
  WarningOutlined, 
  DatabaseOutlined,
  FileZipOutlined,
  InfoCircleOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined
} from '@ant-design/icons'
import styles from './SettingsModal.module.css'

const { Text, Paragraph } = Typography

export default function PrivacySettings({
  exportLoading,
  importLoading,
  onExportData,
  onImportData
}) {
  return (
    <div className={styles.contentSection}>
      {/* 头部区域 */}
      <div className={styles.headerTop}>
        <div className={styles.headerIcon}>
          <DatabaseOutlined />
        </div>
        <div className={styles.headerContent}>
          <h3>数据管理</h3>
          <p className={styles.sectionDesc}>安全地导出和导入您的所有数据</p>
        </div>
      </div>

      {/* 数据说明卡片 */}
      <Card className={styles.generalCard} style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space align="start">
            <InfoCircleOutlined style={{ fontSize: 18, color: 'var(--color-info)', marginTop: 2 }} />
            <div>
              <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                数据包含内容
              </Text>
              <Paragraph style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.8 }}>
                导出的数据包含数据库文件、JSON 格式数据、所有图片附件和恢复说明。
                导入时会自动选择最优恢复方式，确保数据完整性。
              </Paragraph>
            </div>
          </Space>
        </Space>
      </Card>

      {/* 导出数据卡片 */}
      <Card className={styles.generalCard} style={{ marginBottom: 20 }}>
        <div className={styles.privacyAction}>
          <Space direction="vertical" size={4} style={{ flex: 1 }}>
            <Space align="center" size={8}>
              <CloudDownloadOutlined style={{ fontSize: 20, color: 'var(--theme-start-color)' }} />
              <Text strong style={{ fontSize: 16, color: 'var(--text-primary)' }}>
                导出数据
              </Text>
            </Space>
            <Paragraph style={{ margin: '8px 0 0 0', color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.6 }}>
              将所有数据打包为 ZIP 压缩包，包含数据库、JSON 数据和图片附件
            </Paragraph>
            <Space size={8} style={{ marginTop: 8 }}>
              <FileZipOutlined style={{ fontSize: 12, color: 'var(--text-quaternary)' }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                格式：ZIP 压缩包
              </Text>
            </Space>
          </Space>
          <Button
            type="primary"
            icon={<ExportOutlined />}
            onClick={onExportData}
            loading={exportLoading}
            size="large"
            style={{ 
              height: 44,
              minWidth: 120,
              fontSize: 14,
              fontWeight: 500
            }}
          >
            导出数据
          </Button>
        </div>
      </Card>

      {/* 导入数据卡片 - 危险操作 */}
      <Card 
        className={styles.generalCard}
        style={{ 
          borderColor: 'rgba(255, 77, 79, 0.2)',
          background: 'rgba(255, 77, 79, 0.02)'
        }}
      >
        <div className={styles.privacyAction}>
          <Space direction="vertical" size={4} style={{ flex: 1 }}>
            <Space align="center" size={8}>
              <CloudUploadOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
              <Text strong style={{ fontSize: 16, color: 'var(--text-primary)' }}>
                导入数据
              </Text>
            </Space>
            <Paragraph style={{ margin: '8px 0 0 0', color: 'var(--text-tertiary)', fontSize: 13, lineHeight: 1.6 }}>
              从 ZIP 压缩包恢复数据，自动识别最优恢复方式
            </Paragraph>
            <Space size={8} style={{ marginTop: 8 }}>
              <WarningOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
              <Text type="danger" style={{ fontSize: 12, fontWeight: 500 }}>
                此操作将覆盖当前所有数据，请谨慎操作
              </Text>
            </Space>
          </Space>
          <Button
            danger
            icon={<ImportOutlined />}
            onClick={onImportData}
            loading={importLoading}
            size="large"
            style={{ 
              height: 44,
              minWidth: 120,
              fontSize: 14,
              fontWeight: 500
            }}
          >
            导入数据
          </Button>
        </div>
      </Card>
    </div>
  )
}
