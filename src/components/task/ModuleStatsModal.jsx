/**
 * 模块统计报表模态框组件
 * 
 * 功能说明:
 * - 展示各模块的任务统计数据
 * - 显示已完成、未完成、总任务数
 * - 可视化显示完成进度
 */
import React, { useMemo } from 'react'
import { Modal, Table, Progress, Empty } from 'antd'
import { BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons'
import styles from './ModuleStatsModal.module.css'

export default function ModuleStatsModal({
    show,
    modules = [],
    tasks = [],
    onClose
}) {
    // 计算各模块的统计数据
    const statsData = useMemo(() => {
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
        }).filter(stat => stat.totalCount > 0) // 只显示有任务的模块
    }, [modules, tasks])

    // 计算汇总数据
    const summaryData = useMemo(() => {
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

    // 表格列配置
    const columns = [
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
                <span style={{
                    color: '#52c41a',
                    fontWeight: 600,
                    fontSize: 15
                }}>
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
                <span style={{
                    color: count > 0 ? '#faad14' : '#8c8c8c',
                    fontWeight: 600,
                    fontSize: 15
                }}>
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
                <span style={{
                    color: '#722ed1',
                    fontWeight: 600,
                    fontSize: 15
                }}>
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
                    strokeColor={{
                        '0%': '#667eea',
                        '100%': '#52c41a'
                    }}
                    format={(percent) => `${percent}%`}
                />
            )
        }
    ]

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <BarChartOutlined style={{ color: '#667eea', fontSize: 18 }} />
                    <span>模块任务统计报表</span>
                </div>
            }
            open={show}
            onCancel={onClose}
            footer={null}
            width={700}
            centered
        >
            {tasks.length === 0 ? (
                <Empty description="暂无任务数据" />
            ) : (
                <div>
                    {/* 汇总卡片 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 12,
                        marginBottom: 20,
                        padding: 16,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 12
                    }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: 8,
                            padding: '12px 16px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>总任务</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#722ed1' }}>
                                {summaryData.total}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: 8,
                            padding: '12px 16px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>已完成</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#52c41a' }}>
                                {summaryData.totalCompleted}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: 8,
                            padding: '12px 16px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>未完成</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#faad14' }}>
                                {summaryData.totalPending}
                            </div>
                        </div>
                        <div style={{
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: 8,
                            padding: '12px 16px',
                            textAlign: 'center'
                        }}>
                            <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>完成率</div>
                            <div style={{ fontSize: 24, fontWeight: 700, color: '#667eea' }}>
                                {summaryData.overallRate}%
                            </div>
                        </div>
                    </div>

                    {/* 模块统计表格 */}
                    <div className={styles.tableWrapper}>
                        <Table
                            columns={columns}
                            dataSource={statsData}
                            pagination={false}
                            size="middle"
                            scroll={{ y: 300 }}
                            locale={{ emptyText: '暂无模块数据' }}
                        summary={() => (
                            <Table.Summary fixed>
                                <Table.Summary.Row style={{ background: '#fafafa' }}>
                                    <Table.Summary.Cell index={0}>
                                        <span style={{ fontWeight: 600 }}>合计</span>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={1} align="center">
                                        <span style={{ color: '#52c41a', fontWeight: 600 }}>
                                            {summaryData.totalCompleted}
                                        </span>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={2} align="center">
                                        <span style={{ color: '#faad14', fontWeight: 600 }}>
                                            {summaryData.totalPending}
                                        </span>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={3} align="center">
                                        <span style={{ color: '#722ed1', fontWeight: 600 }}>
                                            {summaryData.total}
                                        </span>
                                    </Table.Summary.Cell>
                                    <Table.Summary.Cell index={4}>
                                        <Progress
                                            percent={summaryData.overallRate}
                                            size="small"
                                            strokeColor={{
                                                '0%': '#667eea',
                                                '100%': '#52c41a'
                                            }}
                                        />
                                    </Table.Summary.Cell>
                                </Table.Summary.Row>
                            </Table.Summary>
                        )}
                    />
                    </div>
                </div>
            )}
        </Modal>
    )
}

