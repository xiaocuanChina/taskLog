/**
 * 模块统计组件
 * 
 * 功能说明:
 * - 展示各模块的任务统计数据
 * - 包含汇总卡片和统计表格
 */
import React, { useMemo } from 'react'
import { Table, Progress, Empty } from 'antd'
import { 
    CheckCircleOutlined, 
    ClockCircleOutlined, 
    FileTextOutlined
} from '@ant-design/icons'
import styles from './StatsModal.module.css'

export default function ModuleStats({
    modules = [],
    tasks = []
}) {
    // 计算各模块的统计数据
    const moduleStatsData = useMemo(() => {
        return modules.map(module => {
            const moduleTasks = tasks.filter(task => task.module === module.name)
            const completedCount = moduleTasks.filter(task => task.completed).length
            const pendingCount = moduleTasks.filter(task => !task.completed).length
            const totalCount = moduleTasks.length
            const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

            return {
                key: module.id,
                moduleName: module.name,
                completedCount,
                pendingCount,
                totalCount,
                completionRate
            }
        }).filter(stat => stat.totalCount > 0)
    }, [modules, tasks])

    // 模块统计汇总数据
    const moduleSummaryData = useMemo(() => {
        const totalCompleted = tasks.filter(task => task.completed).length
        const totalPending = tasks.filter(task => !task.completed).length
        const total = tasks.length
        const overallRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0

        return {
            totalCompleted,
            totalPending,
            total,
            overallRate
        }
    }, [tasks])

    // 模块统计表格列配置
    const moduleColumns = [
        {
            title: '模块名称',
            dataIndex: 'moduleName',
            key: 'moduleName',
            width: 150,
            render: (text) => (
                <span style={{ fontWeight: 500 }}>{text}</span>
            )
        },
        {
            title: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    已完成
                </span>
            ),
            dataIndex: 'completedCount',
            key: 'completedCount',
            width: 100,
            align: 'center',
            render: (count) => (
                <span style={{ color: '#52c41a', fontWeight: 600, fontSize: 15 }}>
                    {count}
                </span>
            )
        },
        {
            title: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleOutlined style={{ color: '#faad14' }} />
                    未完成
                </span>
            ),
            dataIndex: 'pendingCount',
            key: 'pendingCount',
            width: 100,
            align: 'center',
            render: (count) => (
                <span style={{ color: count > 0 ? '#faad14' : '#8c8c8c', fontWeight: 600, fontSize: 15 }}>
                    {count}
                </span>
            )
        },
        {
            title: (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FileTextOutlined style={{ color: '#722ed1' }} />
                    总数
                </span>
            ),
            dataIndex: 'totalCount',
            key: 'totalCount',
            width: 80,
            align: 'center',
            render: (count) => (
                <span style={{ color: '#722ed1', fontWeight: 600, fontSize: 15 }}>
                    {count}
                </span>
            )
        },
        {
            title: '完成进度',
            dataIndex: 'completionRate',
            key: 'completionRate',
            width: 180,
            render: (rate) => (
                <Progress
                    percent={rate}
                    size="small"
                    strokeColor={{ '0%': '#667eea', '100%': '#52c41a' }}
                    format={(percent) => `${percent}%`}
                />
            )
        }
    ]

    // 无数据时显示空状态
    if (tasks.length === 0) {
        return <Empty description="暂无任务数据" />
    }

    return (
        <div className={styles.moduleContent}>
            {/* 汇总卡片 */}
            <div className={styles.summaryHeader}>
                <div className={styles.summaryCards}>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>总任务</div>
                        <div className={styles.summaryValue} style={{ color: '#722ed1' }}>
                            {moduleSummaryData.total}
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>已完成</div>
                        <div className={styles.summaryValue} style={{ color: '#52c41a' }}>
                            {moduleSummaryData.totalCompleted}
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>未完成</div>
                        <div className={styles.summaryValue} style={{ color: '#faad14' }}>
                            {moduleSummaryData.totalPending}
                        </div>
                    </div>
                    <div className={styles.summaryCard}>
                        <div className={styles.summaryLabel}>完成率</div>
                        <div className={styles.summaryValue} style={{ color: '#667eea' }}>
                            {moduleSummaryData.overallRate}%
                        </div>
                    </div>
                </div>
            </div>

            {/* 模块统计表格 */}
            <div className={styles.tableWrapper}>
                <Table
                    columns={moduleColumns}
                    dataSource={moduleStatsData}
                    pagination={false}
                    size="middle"
                    scroll={moduleStatsData.length > 8 ? { y: 340 } : undefined}
                    locale={{ emptyText: '暂无模块数据' }}
                    summary={() => (
                        <Table.Summary fixed="bottom">
                            <Table.Summary.Row className={styles.summaryRow}>
                                <Table.Summary.Cell index={0}>
                                    <span style={{ fontWeight: 600 }}>合计</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="center">
                                    <span style={{ color: '#52c41a', fontWeight: 600 }}>
                                        {moduleSummaryData.totalCompleted}
                                    </span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="center">
                                    <span style={{ color: '#faad14', fontWeight: 600 }}>
                                        {moduleSummaryData.totalPending}
                                    </span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} align="center">
                                    <span style={{ color: '#722ed1', fontWeight: 600 }}>
                                        {moduleSummaryData.total}
                                    </span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <Progress
                                        percent={moduleSummaryData.overallRate}
                                        size="small"
                                        strokeColor={{ '0%': '#667eea', '100%': '#52c41a' }}
                                    />
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </div>
        </div>
    )
}

