/**
 * 设置模态框组件
 * 
 * 功能说明:
 * - 提供应用设置的 UI 界面
 * - 支持任务类型的增删改
 * - 支持任务类型颜色的自定义
 * - 提供重置为默认配置的功能
 */
import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Popconfirm, Menu } from 'antd'
import { AppstoreOutlined, InfoCircleOutlined, SettingOutlined, SafetyOutlined, ControlOutlined } from '@ant-design/icons'
import { getConfig, saveConfig, resetConfig } from '../../utils/configManager'
import { useToast } from '../../context/ToastContext'
import GeneralSettings from './GeneralSettings'
import TaskTypesSettings from './TaskTypesSettings'
import PrivacySettings from './PrivacySettings'
import AboutSettings from './AboutSettings'
import styles from './SettingsModal.module.css'

export default function SettingsModal({ visible, onClose }) {
  const showToast = useToast()
  const [form] = Form.useForm()
  const [saveLoading, setSaveLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [taskTypes, setTaskTypes] = useState([])
  const [activeMenu, setActiveMenu] = useState('general')
  const [formValues, setFormValues] = useState({ taskTypes: [], general: { searchScope: 'all' } })
  const [draggedIndex, setDraggedIndex] = useState(null)

  // 加载配置
  useEffect(() => {
    if (visible) {
      loadConfig()
    }
  }, [visible])

  // 监听表单值变化，用于实时预览
  const handleFormChange = () => {
    const values = form.getFieldsValue()
    setFormValues(values)
  }

  const loadConfig = async () => {
    const config = await getConfig()
    setTaskTypes(config.taskTypes)

    // 确保 general 配置完整
    const generalConfig = {
      searchScope: config.general?.searchScope || 'all',
      themeColors: {
        startColor: config.general?.themeColors?.startColor || '#667eea',
        endColor: config.general?.themeColors?.endColor || '#764ba2'
      }
    }

    form.setFieldsValue({
      taskTypes: config.taskTypes,
      general: generalConfig
    })
    setFormValues({
      taskTypes: config.taskTypes,
      general: generalConfig
    })
  }

  // 添加任务类型
  const handleAddType = () => {
    const newTaskTypes = [...taskTypes, { name: '', color: '#1890ff' }]
    setTaskTypes(newTaskTypes)
    form.setFieldsValue({ taskTypes: newTaskTypes })
    setFormValues({ taskTypes: newTaskTypes })
  }

  // 删除任务类型
  const handleDeleteType = (index) => {
    const newTaskTypes = taskTypes.filter((_, i) => i !== index)
    setTaskTypes(newTaskTypes)
    form.setFieldsValue({ taskTypes: newTaskTypes })
    setFormValues({ taskTypes: newTaskTypes })
  }

  // 拖拽开始
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget)
  }

  // 拖拽经过
  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (draggedIndex === null || draggedIndex === index) return

    // 实时交换位置
    const newTaskTypes = [...taskTypes]
    const draggedItem = newTaskTypes[draggedIndex]
    newTaskTypes.splice(draggedIndex, 1)
    newTaskTypes.splice(index, 0, draggedItem)

    setTaskTypes(newTaskTypes)
    form.setFieldsValue({ taskTypes: newTaskTypes })
    setFormValues({ taskTypes: newTaskTypes })
    setDraggedIndex(index)
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // 保存配置
  const handleSave = async () => {
    try {
      const values = await form.validateFields()

      // 获取当前配置
      const config = await getConfig()

      // 如果有任务类型数据，进行验证和转换
      let taskTypes = config.taskTypes
      if (values.taskTypes) {
        // 验证任务类型名称不能为空且不能重复
        const names = values.taskTypes.map(t => t.name.trim())
        if (names.some(name => !name)) {
          showToast('任务类型名称不能为空', 'error')
          return
        }
        if (new Set(names).size !== names.length) {
          showToast('任务类型名称不能重复', 'error')
          return
        }

        // 转换颜色格式为十六进制字符串
        taskTypes = values.taskTypes.map(type => ({
          name: type.name,
          color: typeof type.color === 'string' ? type.color : type.color.toHexString()
        }))
      }

      setSaveLoading(true)

      // 确保 general.themeColors 的颜色值是字符串
      const generalConfig = {
        searchScope: values.general?.searchScope || config.general?.searchScope || 'all',
        themeColors: {
          startColor: typeof values.general?.themeColors?.startColor === 'string'
            ? values.general.themeColors.startColor
            : (values.general?.themeColors?.startColor?.toHexString?.() || config.general?.themeColors?.startColor || '#667eea'),
          endColor: typeof values.general?.themeColors?.endColor === 'string'
            ? values.general.themeColors.endColor
            : (values.general?.themeColors?.endColor?.toHexString?.() || config.general?.themeColors?.endColor || '#764ba2')
        }
      }

      const success = await saveConfig({
        taskTypes,
        general: generalConfig
      })

      if (success) {
        // 立即应用主题色到 CSS 变量
        document.documentElement.style.setProperty('--theme-start-color', generalConfig.themeColors.startColor)
        document.documentElement.style.setProperty('--theme-end-color', generalConfig.themeColors.endColor)
        
        showToast('保存成功', 'success')
        onClose(true) // 传递 true 表示需要刷新
      } else {
        showToast('保存失败', 'error')
      }
    } catch (error) {
      console.error('保存配置失败:', error)
    } finally {
      setSaveLoading(false)
    }
  }

  // 重置配置
  const handleReset = async () => {
    setResetLoading(true)
    const success = await resetConfig()
    if (success) {
      // 重置后应用默认主题色
      document.documentElement.style.setProperty('--theme-start-color', '#667eea')
      document.documentElement.style.setProperty('--theme-end-color', '#764ba2')
      
      showToast('已重置为默认配置', 'success')
      await loadConfig()
    } else {
      showToast('重置失败', 'error')
    }
    setResetLoading(false)
  }

  // 导出数据
  const handleExportData = async () => {
    try {
      setExportLoading(true)
      const result = await window.electron?.data?.export()
      if (result?.success) {
        showToast('数据导出成功', 'success')
      } else {
        showToast(result?.error || '导出失败', 'error')
      }
    } catch (error) {
      console.error('导出数据失败:', error)
      showToast('导出失败', 'error')
    } finally {
      setExportLoading(false)
    }
  }

  // 导入数据
  const handleImportData = async () => {
    try {
      setImportLoading(true)
      const result = await window.electron?.data?.import()
      if (result?.success) {
        showToast('数据导入成功，请重启应用以生效', 'success')
        // 延迟关闭弹窗，让用户看到提示
        setTimeout(() => {
          onClose(true)
        }, 1500)
      } else {
        showToast(result?.error || '导入失败', 'error')
      }
    } catch (error) {
      console.error('导入数据失败:', error)
      showToast('导入失败', 'error')
    } finally {
      setImportLoading(false)
    }
  }

  // 菜单项
  const menuItems = [
    {
      key: 'general',
      icon: <ControlOutlined />,
      label: '通用设置'
    },
    {
      key: 'taskTypes',
      icon: <AppstoreOutlined />,
      label: '任务类型'
    },
    {
      key: 'privacy',
      icon: <SafetyOutlined />,
      label: '隐私'
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: '关于'
    }
  ]

  return (
    <Modal
      title={
        <div className={styles.modalTitle}>
          <SettingOutlined style={{ marginRight: 8 }} />
          设置
        </div>
      }
      open={visible}
      onCancel={() => onClose(false)}
      width={900}
      className={styles.settingsModal}
      footer={[
        <Popconfirm
          key="reset"
          title="确定要重置为默认配置吗？"
          description="此操作将清除所有自定义设置"
          onConfirm={handleReset}
          okText="确定"
          cancelText="取消"
        >
          <Button danger>重置为默认</Button>
        </Popconfirm>,
        <Button key="cancel" onClick={() => onClose(false)}>
          取消
        </Button>,
        <Button key="save" type="primary" loading={saveLoading} onClick={handleSave}>
          保存设置
        </Button>
      ]}
    >
      <div className={styles.settingsContainer}>
        <div className={styles.settingsSidebar}>
          <Menu
            mode="inline"
            selectedKeys={[activeMenu]}
            items={menuItems}
            onClick={({ key }) => setActiveMenu(key)}
          />
        </div>

        <div className={styles.settingsContent}>
          {activeMenu === 'general' && (
            <GeneralSettings
              form={form}
              onFormChange={handleFormChange}
            />
          )}
          {activeMenu === 'taskTypes' && (
            <TaskTypesSettings
              form={form}
              taskTypes={taskTypes}
              formValues={formValues}
              draggedIndex={draggedIndex}
              onFormChange={handleFormChange}
              onAddType={handleAddType}
              onDeleteType={handleDeleteType}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            />
          )}
          {activeMenu === 'privacy' && (
            <PrivacySettings
              exportLoading={exportLoading}
              importLoading={importLoading}
              onExportData={handleExportData}
              onImportData={handleImportData}
            />
          )}
          {activeMenu === 'about' && <AboutSettings />}
        </div>
      </div>
    </Modal>
  )
}
