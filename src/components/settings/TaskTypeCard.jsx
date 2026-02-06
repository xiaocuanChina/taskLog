/**
 * 任务类型卡片组件
 * 优化版本 - 改进视觉效果和交互体验
 */
import { Form, Input, Button, Card, Tag, ColorPicker } from 'antd'
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons'
import styles from './SettingsModal.module.css'

export default function TaskTypeCard({
  index,
  type,
  formValues,
  taskTypesLength,
  isDragging,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd
}) {
  return (
    <Card 
      className={`${styles.typeCard} ${isDragging ? styles.dragging : ''}`}
      size="small"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      <div className={styles.typeCardHeader}>
        <div className={styles.dragHandle}>
          <HolderOutlined style={{ cursor: 'grab', fontSize: 14 }} />
          <span style={{ marginLeft: 6, fontSize: 12 }}>拖动排序</span>
          {index === 0 && (
            <Tag 
              color="blue" 
              style={{ 
                marginLeft: 8, 
                fontSize: 11,
                padding: '0 6px',
                lineHeight: '18px',
                borderRadius: 4
              }}
            >
              默认
            </Tag>
          )}
        </div>
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(index)}
          disabled={taskTypesLength <= 1}
          title={taskTypesLength <= 1 ? '至少保留一个类型' : '删除此类型'}
          style={{ 
            opacity: taskTypesLength <= 1 ? 0.4 : 1,
            cursor: taskTypesLength <= 1 ? 'not-allowed' : 'pointer'
          }}
        />
      </div>
      
      <div className={styles.typeCardContent}>
        <Form.Item
          label="类型名称"
          name={['taskTypes', index, 'name']}
          rules={[{ required: true, message: '请输入类型名称' }]}
          style={{ marginBottom: 16 }}
        >
          <Input 
            placeholder="例如：开发、测试、设计" 
            size="middle"
            maxLength={20}
            showCount
          />
        </Form.Item>
        
        <Form.Item
          label="标识颜色"
          name={['taskTypes', index, 'color']}
          style={{ marginBottom: 12 }}
        >
          <ColorPicker
            showText
            format="hex"
            size="large"
            style={{ width: '100%' }}
            presets={[
              {
                label: '推荐色',
                colors: [
                  '#1890ff',
                  '#52c41a',
                  '#faad14',
                  '#f5222d',
                  '#722ed1',
                  '#13c2c2',
                  '#eb2f96',
                  '#fa8c16',
                ],
              },
            ]}
          />
        </Form.Item>
        
        <div className={styles.typePreview}>
          <span>预览效果：</span>
          <Tag 
            color={(() => {
              const color = formValues.taskTypes?.[index]?.color
              return typeof color === 'string' ? color : color?.toHexString?.() || '#1890ff'
            })()}
            style={{ 
              marginLeft: 8, 
              fontWeight: 500,
              padding: '4px 12px',
              fontSize: 13,
              borderRadius: 6
            }}
          >
            {formValues.taskTypes?.[index]?.name || '任务类型'}
          </Tag>
        </div>
      </div>
    </Card>
  )
}
