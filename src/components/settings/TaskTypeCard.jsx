/**
 * 任务类型卡片组件
 */
import React from 'react'
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
          <HolderOutlined style={{ cursor: 'grab', color: '#8c8c8c' }} />
          <span style={{ marginLeft: 8, fontSize: 12, color: '#8c8c8c' }}>拖动排序</span>
          {index === 0 && (
            <Tag color="blue" style={{ marginLeft: 8 }}>默认类型</Tag>
          )}
        </div>
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onDelete(index)}
          disabled={taskTypesLength <= 1}
          title="删除"
        />
      </div>
      
      <div className={styles.typeCardContent}>
        <div className={styles.typePreview} style={{ marginBottom: 12 }}>
          <span>预览：</span>
          <Tag 
            color={(() => {
              const color = formValues.taskTypes?.[index]?.color
              return typeof color === 'string' ? color : color?.toHexString?.() || '#1890ff'
            })()}
            style={{ marginLeft: 8 }}
          >
            {formValues.taskTypes?.[index]?.name || '任务类型'}
          </Tag>
        </div>
        
        <Form.Item
          label="类型名称"
          name={['taskTypes', index, 'name']}
          rules={[{ required: true, message: '请输入名称' }]}
          style={{ marginBottom: 12 }}
        >
          <Input 
            placeholder="例如：开发" 
            size="middle"
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
            size="middle"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </div>
    </Card>
  )
}
