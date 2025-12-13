/**
 * 统计报表模态框组件
 * 
 * 功能说明:
 * - 使用 Tab 切换模块统计和完成统计
 * - 模块统计：展示各模块的任务统计数据
 * - 完成统计：以日历形式展示完成的任务
 */
import React, { useState, useEffect } from 'react'
import { Modal, Tabs } from 'antd'
import { 
    BarChartOutlined, 
    CalendarOutlined
} from '@ant-design/icons'
import ModuleStats from './ModuleStats'
import CompletionStats from './CompletionStats'
import styles from './StatsModal.module.css'

export default function StatsModal({
    show,
    modules = [],
    tasks = [],
    taskTypeColors = {},
    onClose
}) {
    // 当前激活的 Tab
    const [activeTab, setActiveTab] = useState('module')

    // 关闭时重置状态
    useEffect(() => {
        if (!show) {
            setActiveTab('module')
        }
    }, [show])

    // Tab 内容项
    const tabItems = [
        {
            key: 'module',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BarChartOutlined />
                    模块统计
                </span>
            ),
            children: (
                <ModuleStats 
                    modules={modules} 
                    tasks={tasks} 
                />
            )
        },
        {
            key: 'completion',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined />
                    完成统计
                </span>
            ),
            children: (
                <CompletionStats 
                    tasks={tasks} 
                    taskTypeColors={taskTypeColors}
                    visible={show && activeTab === 'completion'}
                />
            )
        }
    ]

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChartOutlined style={{ color: '#667eea', fontSize: 18 }} />
                    <span>统计报表</span>
                </div>
            }
            open={show}
            onCancel={onClose}
            footer={null}
            width={900}
            centered
            styles={{ body: { padding: '0 24px 16px' } }}
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems}
                className={styles.tabs}
            />
        </Modal>
    )
}

