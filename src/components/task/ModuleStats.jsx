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
    FileTextOutlined,
    TrophyOutlined,
    RiseOutlined
} from '@ant-design/icons'
import styles from './ModuleStatsModal.module.css'

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

    // 找出完成率最高的模块
    const topModule = useMemo(() => {
        if (moduleStatsData.length === 0) return null
        return moduleStatsData.reduce((max, current) => 
            current.completionRate > max.completionRate ? current : max
        )
    }, [moduleStatsData])

    // 模块统计表格列配置
    const moduleColumns = [
        {
            title: '模块名称',
            dataIndex: 'moduleName',
            key: 'moduleName',
            width: 160,
            render: (text, record) => (
                <div className={styles.moduleNameCell}>
                    <span className={styles.moduleName}>{text}</span>
                    {topModule && record.key === topModule.key && record.completionRate === 100 && (
                        <TrophyOutlined className={styles.topBadge} />
                    )}
                </div>
            )
        },
        {
            title: (
                <span className={styles.columnTitle}>
                    <CheckCircleOutlined className={styles.iconSuccess} />
                    已完成
                </span>
            ),
            dataIndex: 'completedCount',
            key: 'completedCount',
            width: 110,
            align: 'center',
            render: (count) => (
                <span className={styles.countSuccess}>
                    {count}
                </span>
            )
        },
        {
            title: (
                <span className={styles.columnTitle}>
                    <ClockCircleOutlined className={styles.iconWarning} />
                    未完成
                </span>
            ),
            dataIndex: 'pendingCount',
            key: 'pendingCount',
            width: 110,
            align: 'center',
            render: (count) => (
                <span className={count > 0 ? styles.countWarning : styles.countMuted}>
                    {count}
                </span>
            )
        },
        {
            title: (
                <span className={styles.columnTitle}>
                    <FileTextOutlined className={styles.iconPrimary} />
                    总数
                </span>
            ),
            dataIndex: 'totalCount',
            key: 'totalCount',
            width: 90,
            align: 'center',
            render: (count) => (
                <span className={styles.countPrimary}>
                    {count}
                </span>
            )
        },
        {
            title: '完成进度',
            dataIndex: 'completionRate',
            key: 'completionRate',
            width: 200,
            render: (rate, record) => (
                <div className={styles.progressCell}>
                    <Progress
                        percent={rate}
                        size="small"
                        strokeColor={
                            rate === 100 
                                ? 'var(--color-success)' 
                                : { 
                                    '0%': 'var(--theme-start-color)', 
                                    '100%': 'var(--theme-end-color)' 
                                }
                        }
                        railColor="var(--border-primary)"
                        format={(percent) => (
                            <span className={styles.progressText}>{percent}%</span>
                        )}
                    />
                </div>
            )
        }
    ]

    // 无数据时显示空状态
    if (tasks.length === 0) {
        return (
            <div className={styles.emptyState}>
                <Empty 
                    description="暂无任务数据" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </div>
        )
    }

    return (
        <div className={styles.moduleContent}>
            {/* 汇总卡片 */}
            <div className={styles.summarySection}>
                <div className={styles.summaryCards}>
                    <div className={`${styles.summaryCard} ${styles.cardTotal}`}>
                        <div className={styles.cardIcon}>
                            <FileTextOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>总任务</div>
                            <div className={styles.cardValue}>{moduleSummaryData.total}</div>
                        </div>
                    </div>
                    
                    <div className={`${styles.summaryCard} ${styles.cardSuccess}`}>
                        <div className={styles.cardIcon}>
                            <CheckCircleOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>已完成</div>
                            <div className={styles.cardValue}>{moduleSummaryData.totalCompleted}</div>
                        </div>
                    </div>
                    
                    <div className={`${styles.summaryCard} ${styles.cardWarning}`}>
                        <div className={styles.cardIcon}>
                            <ClockCircleOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>未完成</div>
                            <div className={styles.cardValue}>{moduleSummaryData.totalPending}</div>
                        </div>
                    </div>
                    
                    <div className={`${styles.summaryCard} ${styles.cardRate}`}>
                        <div className={styles.cardIcon}>
                            <RiseOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>完成率</div>
                            <div className={styles.cardValue}>{moduleSummaryData.overallRate}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 模块统计表格 */}
            <div className={styles.tableSection}>
                <Table
                    columns={moduleColumns}
                    dataSource={moduleStatsData}
                    pagination={false}
                    size="middle"
                    scroll={moduleStatsData.length > 8 ? { y: 340 } : undefined}
                    locale={{ emptyText: '暂无模块数据' }}
                    className={styles.statsTable}
                    summary={() => (
                        <Table.Summary fixed="bottom">
                            <Table.Summary.Row className={styles.summaryRow}>
                                <Table.Summary.Cell index={0}>
                                    <span className={styles.summaryLabel}>合计</span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={1} align="center">
                                    <span className={styles.summarySuccess}>
                                        {moduleSummaryData.totalCompleted}
                                    </span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={2} align="center">
                                    <span className={styles.summaryWarning}>
                                        {moduleSummaryData.totalPending}
                                    </span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={3} align="center">
                                    <span className={styles.summaryPrimary}>
                                        {moduleSummaryData.total}
                                    </span>
                                </Table.Summary.Cell>
                                <Table.Summary.Cell index={4}>
                                    <Progress
                                        percent={moduleSummaryData.overallRate}
                                        size="small"
                                        strokeColor={
                                            moduleSummaryData.overallRate === 100 
                                                ? 'var(--color-success)' 
                                                : { 
                                                    '0%': 'var(--theme-start-color)', 
                                                    '100%': 'var(--theme-end-color)' 
                                                }
                                        }
                                        railColor="var(--border-primary)"
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

