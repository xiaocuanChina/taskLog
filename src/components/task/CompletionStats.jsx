/**
 * 完成统计组件
 * 
 * 功能说明:
 * - 以日历形式展示完成的任务
 * - 支持按日期查看任务详情
 */
import React, { useMemo, useState, useEffect } from 'react'
import { Calendar, Empty, Tag, ConfigProvider } from 'antd'
import { 
    CalendarOutlined, 
    CheckCircleOutlined, 
    LeftOutlined,
    RightOutlined,
    FieldTimeOutlined,
    CloseOutlined,
    TrophyOutlined,
    FireOutlined,
    RiseOutlined,
    CheckSquareOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/locale/zh_CN'
import styles from './CompletionStatsModal.module.css'

// 设置 dayjs 使用中文
dayjs.locale('zh-cn')

export default function CompletionStats({
    tasks = [],
    taskTypeColors = {},
    visible = true
}) {
    // 当前选中的日期
    const [selectedDate, setSelectedDate] = useState(null)
    // 当前日历显示的月份
    const [currentMonth, setCurrentMonth] = useState(dayjs())

    // 重置状态（当组件不可见时）
    useEffect(() => {
        if (!visible) {
            setSelectedDate(null)
            setCurrentMonth(dayjs())
        }
    }, [visible])

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
                onClick={() => setSelectedDate(date)}
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

    // 无数据时显示空状态
    if (completedTasks.length === 0) {
        return <Empty description="暂无完成的任务" />
    }

    return (
        <div className={styles.completionContent}>
            {/* 顶部统计汇总 */}
            <div className={styles.summarySection}>
                <div className={styles.summaryCards}>
                    <div className={`${styles.summaryCard} ${styles.cardMonthly}`}>
                        <div className={styles.cardIcon}>
                            <CheckSquareOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>本月完成</div>
                            <div className={styles.cardValue}>{monthStats.monthCompleted}</div>
                        </div>
                    </div>
                    
                    <div className={`${styles.summaryCard} ${styles.cardActive}`}>
                        <div className={styles.cardIcon}>
                            <FireOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>活跃天数</div>
                            <div className={styles.cardValue}>{monthStats.activeDays}</div>
                        </div>
                    </div>
                    
                    <div className={`${styles.summaryCard} ${styles.cardAverage}`}>
                        <div className={styles.cardIcon}>
                            <RiseOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>日均完成</div>
                            <div className={styles.cardValue}>{monthStats.avgPerDay}</div>
                        </div>
                    </div>
                    
                    <div className={`${styles.summaryCard} ${styles.cardTotal}`}>
                        <div className={styles.cardIcon}>
                            <TrophyOutlined />
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.cardLabel}>累计完成</div>
                            <div className={styles.cardValue}>{totalStats.totalCount}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 月份导航 */}
            <div className={styles.monthNav}>
                <button className={styles.navBtn} onClick={handlePrevMonth} title="上个月">
                    <LeftOutlined />
                </button>
                <div className={styles.monthTitle}>
                    <CalendarOutlined className={styles.monthIcon} />
                    {currentMonth.format('YYYY年MM月')}
                </div>
                <button className={styles.navBtn} onClick={handleNextMonth} title="下个月">
                    <RightOutlined />
                </button>
                <button className={styles.todayBtn} onClick={handleToday}>
                    <CheckCircleOutlined className={styles.todayIcon} />
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
                                    <CalendarOutlined className={styles.titleIcon} />
                                    <span className={styles.titleDate}>{selectedDate.format('MM月DD日')}</span>
                                    <span className={styles.weekDay}>
                                        {['周日', '周一', '周二', '周三', '周四', '周五', '周六'][selectedDate.day()]}
                                    </span>
                                </div>
                                <div className={styles.detailActions}>
                                    <div className={styles.taskCountBadge}>
                                        <CheckCircleOutlined className={styles.badgeIcon} />
                                        <span>{selectedDateTasks.length}</span>
                                    </div>
                                    <CloseOutlined 
                                        className={styles.closeBtn}
                                        onClick={handleCloseDetail}
                                        title="关闭"
                                    />
                                </div>
                            </div>
                            <div className={styles.taskList}>
                                {selectedDateTasks.length > 0 ? (
                                    selectedDateTasks.map(task => (
                                        <div key={task.id} className={styles.taskItem}>
                                            <CheckCircleOutlined className={styles.checkIcon} />
                                            <div className={styles.taskInfo}>
                                                <div className={styles.taskMain}>
                                                    <span className={styles.moduleName}>{task.module}</span>
                                                    <span className={styles.taskName}>{task.name}</span>
                                                    {task.type && (
                                                        <Tag 
                                                            className={styles.taskTypeTag}
                                                            style={{ 
                                                                background: taskTypeColors[task.type] || 'var(--text-quaternary)',
                                                                borderColor: taskTypeColors[task.type] || 'var(--text-quaternary)'
                                                            }}
                                                        >
                                                            {task.type}
                                                        </Tag>
                                                    )}
                                                </div>
                                                <span className={styles.completedTime}>
                                                    <FieldTimeOutlined style={{ marginRight: 4 }} />
                                                    {formatCompletedTime(task.completedAt)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noTasks}>
                                        <Empty 
                                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                                            description="当日没有完成记录" 
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {!selectedDate && (
                        <div className={styles.noSelection}>
                            <div className={styles.emptyIcon}>
                                <CalendarOutlined />
                            </div>
                            <div className={styles.emptyText}>
                                <p>点击日历中有任务的日期</p>
                                <p>查看当天完成详情</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 图例说明 */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendBadge} style={{ background: 'var(--color-success)' }}>
                        <CheckCircleOutlined />
                    </div>
                    <span>有完成任务</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendMax}>
                        <div className={styles.legendBadge} style={{ background: 'var(--color-warning)' }}>
                            <TrophyOutlined />
                        </div>
                    </div>
                    <span>本月最高记录</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendToday}></div>
                    <span>今天</span>
                </div>
            </div>
        </div>
    )
}

