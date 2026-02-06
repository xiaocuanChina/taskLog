/**
 * 任务类型设置组件
 * 重构版本 - 优化 UI 样式和交互体验
 */
import { Form, Button, Empty } from 'antd'
import { PlusOutlined, AppstoreAddOutlined } from '@ant-design/icons'
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
      {/* 头部区域 */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerTop}>
          <div className={styles.headerIcon}>
            <AppstoreAddOutlined />
          </div>
          <div className={styles.headerContent}>
            <h3>任务类型配置</h3>
            <p className={styles.sectionDesc}>
              自定义任务分类和颜色标识，拖拽卡片可调整显示顺序
            </p>
          </div>
        </div>
        
        {/* 使用提示 - 包含统计信息 */}
        <div className={styles.tipSection}>
          <div className={styles.tipIcon}>💡</div>
          <div className={styles.tipContent}>
            <p className={styles.tipTitle}>使用提示</p>
            <ul className={styles.tipList}>
              <li>第一个类型将作为默认类型，创建任务时自动选中</li>
              <li>拖拽卡片可以调整类型的显示顺序</li>
              <li>至少需要保留一个任务类型</li>
            </ul>
          </div>
          
          {/* 统计信息 - 在使用提示右侧 */}
          <div className={styles.statsBar}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>已配置类型</span>
              <span className={styles.statValue}>{taskTypes.length}</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statLabel}>默认类型</span>
              <span 
                className={styles.statValue}
                style={{
                  color: (() => {
                    const color = formValues.taskTypes?.[0]?.color
                    return typeof color === 'string' ? color : color?.toHexString?.() || '#1890ff'
                  })()
                }}
              >
                {formValues.taskTypes?.[0]?.name || '未设置'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <Form form={form} layout="vertical" onValuesChange={onFormChange}>
        {/* 添加按钮 */}
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
        
        {/* 类型卡片网格 */}
        {taskTypes.length > 0 ? (
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
        ) : (
          <div className={styles.emptyState}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无任务类型"
            />
          </div>
        )}
      </Form>
    </div>
  )
}
