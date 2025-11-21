/**
 * 项目备忘便签查看组件
 * 
 * 功能说明:
 * - 用于以便签形式展示项目备忘内容
 * - 提供编辑备忘的快捷入口
 * - 当无备忘内容时显示空状态提示
 * - 使用黄色便签样式,带有图钉装饰
 * - 使用 Ant Design Modal 组件实现
 * 
 * 使用场景:
 * - 在任务管理视图中查看项目备忘
 * - 快速浏览项目的重要信息
 */
import React from 'react'
import { Modal, Button, Empty } from 'antd'
import { EditOutlined, FileTextOutlined, PushpinOutlined } from '@ant-design/icons'
export default function ProjectMemoView({ show, memo, projectName, onEdit, onClose }) {
  return (
    <Modal
      open={show}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined />
          <span>{projectName} - 项目备忘</span>
        </div>
      }
      onCancel={onClose}
      footer={[
        <Button key="edit" type="primary" icon={<EditOutlined />} onClick={onEdit}>
          编辑备忘
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
      centered
      width={600}
      style={{ top: 20 }}
    >
      {memo ? (
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          padding: '16px', 
          backgroundColor: '#fffbe6',
          borderRadius: 8,
          minHeight: 200,
          position: 'relative',
          border: '1px solid #ffe58f'
        }}>
          {memo}
          <PushpinOutlined 
            style={{ 
              position: 'absolute', 
              bottom: 12, 
              right: 12, 
              fontSize: 20, 
              color: '#faad14',
              transform: 'rotate(45deg)'
            }} 
          />
        </div>
      ) : (
        <Empty
          image={<FileTextOutlined style={{ fontSize: 60, color: '#d9d9d9' }} />}
          description="暂无备忘内容"
        >
          <Button type="primary" onClick={onEdit}>
            添加备忘
          </Button>
        </Empty>
      )}
    </Modal>
  )
}
