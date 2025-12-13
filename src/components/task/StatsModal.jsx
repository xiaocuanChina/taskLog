/**
 * 统计报表模态框组件
 * 
 * 功能说明:
 * - 使用 Tab 切换模块统计和完成统计
 * - 模块统计：展示各模块的任务统计数据
 * - 完成统计：以日历形式展示完成的任务
 */
import React, { useMemo, useState, useEffect } from 'react'
import { Modal, Tabs, Table, Progress, Calendar, Empty, Tag, ConfigProvider } from 'antd'
import { 
    BarChartOutlined, 
    CalendarOutlined, 
    CheckCircleOutlined, 
    ClockCircleOutlined, 
    FileTextOutlined,
    LeftOutlined,
    RightOutlined,
    FieldTimeOutlined,
    CloseOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/locale/zh_CN'
import styles from './StatsModal.module.css'

// 设置 dayjs 使用中文
dayjs.locale('zh-cn')

export default function StatsModal({
    show,
    modules = [],
    tasks = [],
    taskTypeColors = {},
    onClose
}) {
    // 当前激活的 Tab
    const [activeTab, setActiveTab] = useState('module')
    // 完成统计：当前选中的日期
    const [selectedDate, setSelectedDate] = useState(null)
    // 完成统计：当前日历显示的月份
    const [currentMonth, setCurrentMonth] = useState(dayjs())

    // 关闭时重置状态
    useEffect(() => {
        if (!show) {
            setActiveTab('module')
            setSelectedDate(null)
            setCurrentMonth(dayjs())
        }
    }, [show])

    // ============ 模块统计相关 ============
    
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

    // ============ 完成统计相关 ============

    // 获取所有完成的任务
    const completedTasks = useMemo(() => {
        return tasks.filter(task => task.completed && task.completedAt)
    }, [tasks])

    // 按日期分组统计
    const tasksByDateMap = useMemo(() => {
        const map = new Map()
        
        completedTasks.forEach(task => {
            const date = new Date(task.completedAt)
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            
            if (!map.has(dateKey)) {
                map.set(dateKey, [])
            }
            map.get(dateKey).push(task)
        })

        return map
    }, [completedTasks])

    // 计算当前月份的统计数据
    const monthStats = useMemo(() => {
        const monthStart = currentMonth.startOf('month')
        const monthEnd = currentMonth.endOf('month')
        
        let monthCompleted = 0
        let activeDays = 0
        let maxDayCount = 0
        let maxDayDate = null

        tasksByDateMap.forEach((dayTasks, dateKey) => {
            const date = dayjs(dateKey)
            if (date.isAfter(monthStart.subtract(1, 'day')) && date.isBefore(monthEnd.add(1, 'day'))) {
                monthCompleted += dayTasks.length
                activeDays++
                if (dayTasks.length > maxDayCount) {
                    maxDayCount = dayTasks.length
                    maxDayDate = dateKey
                }
            }
        })

        return {
            monthCompleted,
            activeDays,
            avgPerDay: activeDays > 0 ? (monthCompleted / activeDays).toFixed(1) : 0,
            maxDayCount,
            maxDayDate
        }
    }, [tasksByDateMap, currentMonth])

    // 总体统计数据
    const totalStats = useMemo(() => {
        const totalCount = completedTasks.length
        const daysCount = tasksByDateMap.size
        return {
            totalCount,
            daysCount,
            avgPerDay: daysCount > 0 ? (totalCount / daysCount).toFixed(1) : 0
        }
    }, [completedTasks, tasksByDateMap])

    // 获取选中日期的任务列表
    const selectedDateTasks = useMemo(() => {
        if (!selectedDate) return []
        const dateKey = selectedDate.format('YYYY-MM-DD')
        return tasksByDateMap.get(dateKey) || []
    }, [selectedDate, tasksByDateMap])

    // 格式化完成时间
    function formatCompletedTime(completedAt) {
        const date = new Date(completedAt)
        return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }

    // 自定义完整日期单元格渲染
    const fullCellRender = (date, info) => {
        if (info.type !== 'date') return info.originNode

        const dateKey = date.format('YYYY-MM-DD')
        const dayTasks = tasksByDateMap.get(dateKey)
        const hasTasks = dayTasks && dayTasks.length > 0
        const isSelected = selectedDate && selectedDate.format('YYYY-MM-DD') === dateKey
        const isMaxDay = monthStats.maxDayDate === dateKey
        const isToday = date.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
        const isCurrentMonth = date.month() === currentMonth.month()

        return (
            <div 
                className={`${styles.dateCell} ${hasTasks ? styles.hasTasks : ''} ${isSelected ? styles.selected : ''} ${isMaxDay ? styles.maxDay : ''} ${isToday ? styles.today : ''} ${!isCurrentMonth ? styles.otherMonth : ''}`}
                onClick={() => {
                    if (hasTasks) {
                        setSelectedDate(date)
                    }
                }}
            >
                {isMaxDay && <span className={styles.crownIcon}>🏆</span>}
                <div className={styles.dateNumber}>
                    {date.date()}
                </div>
                {hasTasks && (
                    <div className={styles.taskCount}>
                        <span className={styles.countNumber}>{dayTasks.length}</span>
                    </div>
                )}
            </div>
        )
    }

    // 月份切换
    const handlePrevMonth = () => {
        setCurrentMonth(currentMonth.subtract(1, 'month'))
        setSelectedDate(null)
    }

    const handleNextMonth = () => {
        setCurrentMonth(currentMonth.add(1, 'month'))
        setSelectedDate(null)
    }

    const handleToday = () => {
        setCurrentMonth(dayjs())
        setSelectedDate(dayjs())
    }

    const handleCloseDetail = () => {
        setSelectedDate(null)
    }

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
            children: tasks.length === 0 ? (
                <Empty description="暂无任务数据" />
            ) : (
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
                            scroll={{ y: 300 }}
                            sticky
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
        },
        {
            key: 'completion',
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarOutlined />
                    完成统计
                </span>
            ),
            children: completedTasks.length === 0 ? (
                <Empty description="暂无完成的任务" />
            ) : (
                <div className={styles.completionContent}>
                    {/* 顶部统计汇总 */}
                    <div className={styles.summaryHeader}>
                        <div className={styles.summaryCards}>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>本月完成</div>
                                <div className={styles.summaryValue} style={{ color: '#52c41a' }}>
                                    {monthStats.monthCompleted}
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>活跃天数</div>
                                <div className={styles.summaryValue} style={{ color: '#1890ff' }}>
                                    {monthStats.activeDays}
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>日均完成</div>
                                <div className={styles.summaryValue} style={{ color: '#722ed1' }}>
                                    {monthStats.avgPerDay}
                                </div>
                            </div>
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryLabel}>累计完成</div>
                                <div className={styles.summaryValue} style={{ color: '#fa541c' }}>
                                    {totalStats.totalCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 月份导航 */}
                    <div className={styles.monthNav}>
                        <button className={styles.navBtn} onClick={handlePrevMonth}>
                            <LeftOutlined />
                        </button>
                        <span className={styles.monthTitle}>
                            {currentMonth.format('YYYY年MM月')}
                        </span>
                        <button className={styles.navBtn} onClick={handleNextMonth}>
                            <RightOutlined />
                        </button>
                        <button className={styles.todayBtn} onClick={handleToday}>
                            今天
                        </button>
                    </div>

                    {/* 日历和详情区域 */}
                    <div className={styles.mainContent}>
                        {/* 日历 */}
                        <div className={styles.calendarWrapper}>
                            <ConfigProvider locale={zhCN}>
                                <Calendar
                                    fullscreen={false}
                                    value={currentMonth}
                                    onPanelChange={(date) => {
                                        setCurrentMonth(date)
                                        setSelectedDate(null)
                                    }}
                                    fullCellRender={fullCellRender}
                                    headerRender={() => null}
                                />
                            </ConfigProvider>
                        </div>

                        {/* 任务详情面板 */}
                        <div className={`${styles.detailPanel} ${selectedDate ? styles.visible : ''}`}>
                            {selectedDate && (
                                <>
                                    <div className={styles.detailHeader}>
                                        <div className={styles.detailTitle}>
                                            <CalendarOutlined style={{ marginRight: 8 }} />
                                            {selectedDate.format('MM月DD日')}
                                            <span className={styles.weekDay}>
                                                {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][selectedDate.day()]}
                                            </span>
                                        </div>
                                        <div className={styles.detailActions}>
                                            <Tag color="green">完成 {selectedDateTasks.length} 项</Tag>
                                            <CloseOutlined 
                                                className={styles.closeBtn}
                                                onClick={handleCloseDetail}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.taskList}>
                                        {selectedDateTasks.map(task => (
                                            <div key={task.id} className={styles.taskItem}>
                                                <CheckCircleOutlined className={styles.checkIcon} />
                                                <div className={styles.taskInfo}>
                                                    <div className={styles.taskMain}>
                                                        <span className={styles.moduleName}>[{task.module}]</span>
                                                        {task.type && (
                                                            <Tag 
                                                                style={{ 
                                                                    background: taskTypeColors[task.type] || '#d9d9d9',
                                                                    color: '#fff',
                                                                    border: 'none',
                                                                    fontSize: 11,
                                                                    padding: '0 6px',
                                                                    margin: 0
                                                                }}
                                                            >
                                                                {task.type}
                                                            </Tag>
                                                        )}
                                                        <span className={styles.taskName}>{task.name}</span>
                                                    </div>
                                                    <span className={styles.completedTime}>
                                                        <FieldTimeOutlined style={{ marginRight: 4 }} />
                                                        {formatCompletedTime(task.completedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {!selectedDate && (
                                <div className={styles.noSelection}>
                                    <CalendarOutlined style={{ fontSize: 40, color: '#d9d9d9', marginBottom: 12 }} />
                                    <p>点击日历中有任务的日期</p>
                                    <p>查看当天完成详情</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 图例说明 */}
                    <div className={styles.legend}>
                        <span className={styles.legendItem}>
                            <span className={styles.legendBadge} style={{ background: '#52c41a' }}>x</span>
                            <span>有完成任务</span>
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.legendMax}>
                                <span className={styles.legendBadge} style={{ background: '#faad14' }}>x</span>
                                <span className={styles.legendTrophy}>🏆</span>
                            </span>
                            <span>本月最高记录</span>
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.legendToday}></span>
                            <span>今天</span>
                        </span>
                    </div>
                </div>
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

