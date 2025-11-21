/**
 * 任务类型设置组件
 */
import React from 'react'
import { Form, Button, Divider } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import TaskTypeCard from './TaskTypeCard'
import styles from './SettingsModal.module.css'

export default function TaskTypesSettings({
  form,
  taskTypes,
  formValues,
  draggedIndex,
  onFormChange,
  onAddType,
  onDeleteType,
  onDragStart,
  onDragOver,
  onDragEnd
}) {
  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        <h3>任务类型配置</h3>
        <p className={styles.sectionDesc}>管理任务的分类和颜色标识</p>
      </div>
      
      <Divider />
      
      <Form form={form} layout="vertical" onValuesChange={onFormChange}>
        <div className={styles.typeGrid}>
          {taskTypes.map((type, index) => (
            <TaskTypeCard
              key={index}
              index={index}
              type={type}
              formValues={formValues}
              taskTypesLength={taskTypes.length}
              isDragging={draggedIndex === index}
              onDelete={onDeleteType}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
        
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={onAddType}
          block
          size="large"
          className={styles.addButton}
        >
          添加新类型
        </Button>
      </Form>
    </div>
  )
}
