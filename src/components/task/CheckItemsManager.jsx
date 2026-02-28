/**
 * 勾选项管理组件
 * 
 * 功能说明:
 * - 支持树形结构的勾选项管理
 * - 支持拖拽排序
 * - 支持添加、编辑、删除勾选项
 * - 支持为勾选项添加备注
 * - 支持单选/多选模式切换
 * - 支持父子联动配置
 */
import { useState, useMemo } from 'react'
import { Switch, Radio, Tree, Button, Input, Space, Tag, Tooltip, Empty, Modal } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  HolderOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import styles from './CheckItemsManager.module.css'

const { TextArea } = Input

// 辅助函数：将平铺列表转换为树形结构
const buildTreeData = (items) => {
  const itemMap = {}
  const tree = []

  items.forEach(item => {
    itemMap[item.id] = {
      ...item,
      key: item.id,
      value: item.id,
      title: item.name,
      remark: item.remark || '',
      children: []
    }
  })

  items.forEach(item => {
    if (item.parentId && itemMap[item.parentId]) {
      itemMap[item.parentId].children.push(itemMap[item.id])
    } else {
      tree.push(itemMap[item.id])
    }
  })

  return tree
}

export default function CheckItemsManager({ checkItems, onChange }) {
  const [editingItemId, setEditingItemId] = useState(null)
  const [editingRemarkItemId, setEditingRemarkItemId] = useState(null)
  const [remarkInputValue, setRemarkInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [pendingPasteContent, setPendingPasteContent] = useState(null)
  const [isPasting, setIsPasting] = useState(false)

  const enabled = checkItems?.enabled || false
  const mode = checkItems?.mode || 'multiple'
  const linkage = checkItems?.linkage !== false
  const items = checkItems?.items || []
  const newItemName = checkItems?.newItemName || ''
  const newItemParentId = checkItems?.newItemParentId || null

  // 生成树形数据
  const treeData = useMemo(() => buildTreeData(items), [items])

  // 更新勾选项配置
  const updateCheckItems = (updates) => {
    onChange({
      ...checkItems,
      ...updates
    })
  }

  // 切换启用状态
  const handleToggleEnabled = (checked) => {
    updateCheckItems({
      enabled: checked,
      mode: mode || 'multiple',
      items: items || []
    })
  }

  // 切换勾选模式
  const handleModeChange = (newMode) => {
    let updatedItems = [...items]
    if (newMode === 'single') {
      const firstChecked = updatedItems.findIndex(item => item.checked)
      updatedItems = updatedItems.map((item, idx) => ({
        ...item,
        checked: idx === firstChecked
      }))
    }
    updateCheckItems({
      mode: newMode,
      items: updatedItems
    })
  }

  // 切换父子联动
  const handleLinkageChange = (checked) => {
    updateCheckItems({ linkage: checked })
  }

  // 处理粘贴事件
  const handlePaste = (e) => {
    // 仅在非编辑模式下处理
    if (editingItemId) return

    const pastedText = e.clipboardData.getData('text')
    if (!pastedText) return

    // 标记正在粘贴
    setIsPasting(true)
    
    // 检测是否包含换行符
    if (/\n/.test(pastedText)) {
      // 分割为多行
      const lines = pastedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)

      // 如果拆分后有多行，保存待处理内容（但不阻止默认粘贴行为）
      if (lines.length > 1) {
        setPendingPasteContent(lines)
      }
    }
    
    // 延迟重置粘贴标记
    setTimeout(() => setIsPasting(false), 100)
  }

  // 添加或更新勾选项
  const handleAddOrUpdate = () => {
    const name = newItemName.trim()
    if (!name) return

    // 检查是否有待处理的粘贴内容（优先级最高）
    if (!editingItemId && pendingPasteContent && pendingPasteContent.length > 1) {
      const lines = pendingPasteContent
      
      // 构建预览内容
      const previewContent = (
        <div>
          <p>检测到粘贴内容包含 {lines.length} 行文本：</p>
          <div style={{ 
            maxHeight: '300px', 
            overflowY: 'auto', 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px',
            marginTop: '12px'
          }}>
            {lines.map((line, index) => (
              <div key={index} style={{ 
                padding: '4px 0', 
                borderBottom: index < lines.length - 1 ? '1px solid #e0e0e0' : 'none'
              }}>
                <span style={{ color: '#999', marginRight: '8px' }}>{index + 1}.</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '12px', color: '#666' }}>
            是否拆分为 {lines.length} 个勾选项？
          </p>
        </div>
      )
      
      Modal.confirm({
        title: '检测到多行内容',
        content: previewContent,
        okText: '拆分为多个',
        cancelText: '合并为一个',
        width: 600,
        onOk: () => {
          // 批量添加多个勾选项
          handleBatchAdd(lines)
          setPendingPasteContent(null)
        },
        onCancel: () => {
          // 合并为一个，使用输入框中显示的内容
          handleSingleAdd(name)
          setPendingPasteContent(null)
        }
      })
      return
    }

    // 清除待处理内容
    setPendingPasteContent(null)

    // 正常的单项添加或更新逻辑
    const trimmedName = name.replace(/\n/g, ' ').trim()
    
    // 检查重名（仅在同级检查）
    const targetParentId = newItemParentId || null
    const isDuplicate = items.some(
      item =>
        item.name === trimmedName &&
        item.id !== editingItemId &&
        (item.parentId || null) === targetParentId
    )

    if (isDuplicate) {
      setInputError('同级下已存在相同名称的勾选项')
      return
    }

    setInputError('')

    let newItems = [...items]

    if (editingItemId) {
      // 更新现有项
      newItems = newItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name: trimmedName,
            parentId: newItemParentId || null
          }
        }
        return item
      })
      setEditingItemId(null)
    } else {
      // 添加新项
      newItems.push({
        id: Date.now().toString(),
        name: trimmedName,
        checked: false,
        parentId: newItemParentId || null
      })
    }

    updateCheckItems({
      items: newItems,
      newItemName: '',
      newItemParentId: null
    })
  }

  // 批量添加多个勾选项
  const handleBatchAdd = (lines) => {
    const targetParentId = newItemParentId || null
    let newItems = [...items]
    const addedItems = []

    lines.forEach((line, index) => {
      // 检查是否重名
      const isDuplicate = newItems.some(
        item =>
          item.name === line &&
          (item.parentId || null) === targetParentId
      )

      if (!isDuplicate) {
        const newItem = {
          id: (Date.now() + index).toString(),
          name: line,
          checked: false,
          parentId: targetParentId
        }
        newItems.push(newItem)
        addedItems.push(line)
      }
    })

    updateCheckItems({
      items: newItems,
      newItemName: '',
      newItemParentId: null
    })

    // 清空待处理内容
    setPendingPasteContent(null)

    // 提示添加结果
    if (addedItems.length === lines.length) {
      setInputError('')
    } else {
      setInputError(`已添加 ${addedItems.length} 项，${lines.length - addedItems.length} 项因重名被跳过`)
    }
  }

  // 单项添加（合并后的内容）
  const handleSingleAdd = (nameToAdd) => {
    const targetParentId = newItemParentId || null
    const trimmedName = nameToAdd.trim()
    
    if (!trimmedName) {
      setInputError('勾选项名称不能为空')
      return
    }
    
    // 检查重名
    const isDuplicate = items.some(
      item =>
        item.name === trimmedName &&
        (item.parentId || null) === targetParentId
    )

    if (isDuplicate) {
      setInputError('同级下已存在相同名称的勾选项')
      setPendingPasteContent(null)
      return
    }

    setInputError('')

    const newItems = [...items, {
      id: Date.now().toString(),
      name: trimmedName,
      checked: false,
      parentId: targetParentId
    }]

    updateCheckItems({
      items: newItems,
      newItemName: '',
      newItemParentId: null
    })

    // 清空待处理内容
    setPendingPasteContent(null)
  }

  // 删除勾选项（包括所有子项）
  const handleDelete = (itemId) => {
    const getChildrenIds = (parentId, allItems) => {
      let ids = []
      allItems.forEach(item => {
        if (item.parentId === parentId) {
          ids.push(item.id)
          ids = [...ids, ...getChildrenIds(item.id, allItems)]
        }
      })
      return ids
    }

    const idsToDelete = [itemId, ...getChildrenIds(itemId, items)]
    const newItems = items.filter(item => !idsToDelete.includes(item.id))

    updateCheckItems({ items: newItems })

    if (editingItemId && idsToDelete.includes(editingItemId)) {
      setEditingItemId(null)
      updateCheckItems({
        items: newItems,
        newItemName: '',
        newItemParentId: null
      })
    }
  }

  // 开始编辑
  const handleEdit = (item) => {
    setEditingItemId(item.id)
    setEditingRemarkItemId(null)
    setInputError('')
    setPendingPasteContent(null)
    updateCheckItems({
      newItemName: item.name,
      newItemParentId: item.parentId || null
    })
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingItemId(null)
    setInputError('')
    setPendingPasteContent(null)
    updateCheckItems({
      newItemName: '',
      newItemParentId: null
    })
  }

  // 开始编辑备注
  const handleEditRemark = (item) => {
    setEditingRemarkItemId(item.id)
    setRemarkInputValue(item.remark || '')
    setEditingItemId(null)
  }

  // 保存备注
  const handleSaveRemark = () => {
    if (!editingRemarkItemId) return

    const newItems = items.map(item => {
      if (item.id === editingRemarkItemId) {
        return { ...item, remark: remarkInputValue.trim() }
      }
      return item
    })

    updateCheckItems({ items: newItems })
    setEditingRemarkItemId(null)
    setRemarkInputValue('')
  }

  // 取消备注编辑
  const handleCancelRemark = () => {
    setEditingRemarkItemId(null)
    setRemarkInputValue('')
  }

  // 添加子项
  const handleAddChild = (parentId) => {
    setEditingItemId(null)
    setEditingRemarkItemId(null)
    setInputError('')
    setPendingPasteContent(null)
    updateCheckItems({
      newItemName: '',
      newItemParentId: parentId
    })
  }

  // 拖拽排序
  const handleDrop = (info) => {
    const dropKey = info.node.key
    const dragKey = info.dragNode.key
    const dropPos = info.node.pos.split('-')
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

    const dragItem = items.find(i => i.id === dragKey)
    if (!dragItem) return

    let newItems = items.filter(i => i.id !== dragKey)

    let newParentId = null
    let insertIndex = 0

    if (info.dropToGap) {
      newParentId = info.node.parentId || null
      if (dropPosition === -1) {
        insertIndex = newItems.findIndex(i => i.id === dropKey)
      } else {
        insertIndex = newItems.findIndex(i => i.id === dropKey) + 1
      }
    } else {
      newParentId = dropKey
      const lastChildIndex = newItems.reduce((lastIdx, item, idx) => {
        if ((item.parentId || null) === newParentId) return idx
        return lastIdx
      }, -1)
      insertIndex = lastChildIndex + 1
    }

    const updatedDragItem = { ...dragItem, parentId: newParentId }
    newItems.splice(insertIndex, 0, updatedDragItem)

    updateCheckItems({ items: newItems })
  }

  // 获取父项名称
  const getParentName = (parentId) => {
    const parent = items.find(i => i.id === parentId)
    return parent?.name || '未知项'
  }

  // 渲染树节点
  const renderTreeNode = (nodeData) => (
    <div className={styles.nodeWrapper}>
      <div className={styles.treeNode}>
        <div
          className={styles.nodeContent}
          onDoubleClick={(e) => {
            e.stopPropagation()
            handleEdit(nodeData)
          }}
        >
          <div className={styles.nodeInfo}>
            <span className={styles.nodeName}>{nodeData.title}</span>
            {nodeData.remark && (
              <Tooltip title={nodeData.remark} placement="top">
                <FileTextOutlined className={styles.remarkIcon} />
              </Tooltip>
            )}
          </div>
          <div className={styles.nodeActions}>
            <Tooltip title={nodeData.remark ? '编辑备注' : '添加备注'}>
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined />}
                className={nodeData.remark ? styles.hasRemark : ''}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditRemark(nodeData)
                }}
              />
            </Tooltip>
            <Tooltip title="添加子项">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddChild(nodeData.id)
                }}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit(nodeData)
                }}
              />
            </Tooltip>
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(nodeData.id)
                }}
              />
            </Tooltip>
            <Tooltip title="拖动排序">
              <HolderOutlined className={styles.dragHandle} />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* 备注显示区域 - 已移除 */}


      {/* 备注编辑区域 */}
      {editingRemarkItemId === nodeData.id && (
        <div className={styles.remarkEditor} onClick={(e) => e.stopPropagation()}>
          <TextArea
            placeholder="输入备注内容..."
            value={remarkInputValue}
            onChange={(e) => setRemarkInputValue(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            autoFocus
          />
          <Space className={styles.remarkActions}>
            <Button type="primary" size="small" onClick={handleSaveRemark}>
              保存
            </Button>
            <Button size="small" onClick={handleCancelRemark}>
              取消
            </Button>
          </Space>
        </div>
      )}
    </div>
  )

  return (
    <div className={styles.container}>
      {/* 头部控制区 */}
      <div className={styles.header}>
        <div className={styles.toggleSection}>
          <Switch checked={enabled} onChange={handleToggleEnabled} />
          <CheckCircleOutlined className={styles.icon} />
          <span className={styles.label}>
            {enabled ? '勾选项已启用' : '启用勾选项'}
          </span>
        </div>

        {enabled && (
          <div className={styles.options}>
            <div className={styles.option}>
              <span className={styles.optionLabel}>勾选方式:</span>
              <Radio.Group
                value={mode}
                onChange={(e) => handleModeChange(e.target.value)}
                optionType="button"
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="multiple">多选</Radio.Button>
                <Radio.Button value="single">单选</Radio.Button>
              </Radio.Group>
            </div>
            {mode !== 'single' && (
              <div className={styles.option}>
                <span className={styles.optionLabel}>父子联动:</span>
                <Switch size="small" checked={linkage} onChange={handleLinkageChange} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 勾选项列表 */}
      {enabled && (
        <div className={styles.content}>
          {items.length > 0 ? (
            <div className={styles.treeSection}>
              <div className={styles.sectionHeader}>
                <span>已添加的勾选项</span>
                <Tag color="purple">{items.length}</Tag>
              </div>
              <Tree
                treeData={treeData}
                defaultExpandAll
                draggable
                onDrop={handleDrop}
                titleRender={renderTreeNode}
                blockNode
                className={styles.tree}
              />
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无勾选项"
              className={styles.empty}
            />
          )}

          {/* 输入区域 */}
          <div className={styles.inputSection}>
            {/* 父级提示 */}
            {!editingItemId && newItemParentId && (
              <div className={styles.parentHint}>
                <span>添加到:</span>
                <Tag
                  closable
                  onClose={() => updateCheckItems({ newItemParentId: null })}
                  color="blue"
                >
                  {getParentName(newItemParentId)}
                </Tag>
              </div>
            )}

            {/* 编辑提示 */}
            {editingItemId && (
              <div className={styles.editHint}>
                <span>正在编辑:</span>
                <Tag closable onClose={handleCancelEdit} color="orange">
                  {items.find(i => i.id === editingItemId)?.name || '未知项'}
                </Tag>
              </div>
            )}

            {/* 输入框 */}
            <Space.Compact className={styles.inputGroup}>
              <Input
                placeholder={
                  editingItemId
                    ? '修改勾选项名称'
                    : newItemParentId
                    ? '输入子项名称'
                    : '添加勾选项'
                }
                value={newItemName}
                status={inputError ? 'error' : undefined}
                onChange={(e) => {
                  setInputError('')
                  // 只有在非粘贴时才清空待处理内容
                  if (!isPasting) {
                    setPendingPasteContent(null)
                  }
                  updateCheckItems({ newItemName: e.target.value })
                }}
                onPaste={handlePaste}
                onPressEnter={(e) => {
                  e.preventDefault()
                  handleAddOrUpdate()
                }}
              />
              <Button
                type="primary"
                onClick={handleAddOrUpdate}
                icon={editingItemId ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingItemId ? '保存' : '添加'}
              </Button>
            </Space.Compact>

            {/* 错误提示 */}
            {inputError && <div className={styles.errorText}>{inputError}</div>}
          </div>
        </div>
      )}
    </div>
  )
}
