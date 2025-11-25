import React from 'react'
import { Divider, Button, Tooltip } from 'antd'
import { UndoOutlined } from '@ant-design/icons'

export default function RecycleBin({ modules, onRestore }) {
  if (!modules || modules.length === 0) return null
  
  return (
    <div style={{ marginTop: 0 }}>
      <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
        {modules.map(module => (
          <div key={module.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            marginBottom: 8,
            background: '#fff1f0',
            borderRadius: 4,
            border: '1px solid #ffa39e'
          }}>
            <span style={{ flex: 1, color: '#cf1322', textDecoration: 'line-through' }}>
              {module.name}
            </span>
            <Tooltip title="恢复模块">
              <Button
                type="text"
                size="small"
                icon={<UndoOutlined />}
                onClick={() => onRestore(module.id)}
                style={{ color: '#1890ff' }}
              >
                恢复
              </Button>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  )
}

