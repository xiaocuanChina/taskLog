if (!window.React || !window.ReactDOM) {
  const el = document.getElementById('root')
  if (el) el.innerText = '页面资源未加载，请检查网络或改用本地依赖'
} else {
function App() {
  const [pong, setPong] = React.useState('')
  const versions = window.electron?.versions || null
  const [name, setName] = React.useState('')
  const [parent, setParent] = React.useState('')
  const [assignee, setAssignee] = React.useState('')
  const [files, setFiles] = React.useState([])
  const [tasks, setTasks] = React.useState([])
  const [todayCount, setTodayCount] = React.useState(0)

  React.useEffect(() => {
    window.electron?.ping()?.then(setPong)
    refresh()
  }, [])

  async function refresh() {
    const list = await window.electron?.tasks?.list?.()
    setTasks(Array.isArray(list) ? list : [])
    const stats = await window.electron?.tasks?.todayStats?.()
    setTodayCount(stats?.count || 0)
  }

  function onFileChange(e) {
    const fl = e.target.files || []
    setFiles(fl)
  }

  async function toPayloadFiles(fl) {
    const arr = []
    for (let i = 0; i < fl.length; i++) {
      const f = fl[i]
      const buf = await f.arrayBuffer()
      arr.push({ name: f.name, buffer: new Uint8Array(buf) })
    }
    return arr
  }

  async function onAdd(e) {
    e.preventDefault()
    const images = await toPayloadFiles(files)
    await window.electron?.tasks?.add?.({ name, parent, assignee, images })
    setName('')
    setParent('')
    setAssignee('')
    setFiles([])
    await refresh()
  }

  async function onMarkDone(id) {
    await window.electron?.tasks?.markDone?.(id)
    await refresh()
  }

  function renderForm() {
    return React.createElement(
      'form',
      { onSubmit: onAdd, style: { display: 'grid', gap: 8, maxWidth: 600 } },
      React.createElement('h2', null, '新增任务'),
      React.createElement('label', null, '任务名'),
      React.createElement('input', { value: name, onChange: e => setName(e.target.value), placeholder: '请输入任务名' }),
      React.createElement('label', null, '所属上级'),
      React.createElement('input', { value: parent, onChange: e => setParent(e.target.value), placeholder: '请输入所属上级' }),
      React.createElement('label', null, '分配人'),
      React.createElement('input', { value: assignee, onChange: e => setAssignee(e.target.value), placeholder: '请输入分配人' }),
      React.createElement('label', null, '上传图片'),
      React.createElement('input', { type: 'file', multiple: true, onChange: onFileChange }),
      React.createElement('button', { type: 'submit' }, '新增任务')
    )
  }

  function renderTaskItem(t) {
    const disabled = !!t.completed
    return React.createElement(
      'li',
      { key: t.id, style: { display: 'flex', alignItems: 'center', gap: 8 } },
      React.createElement('div', null, `${t.name}（上级：${t.parent}，分配人：${t.assignee}）`),
      React.createElement('div', { style: { color: disabled ? '#3c8' : '#999' } }, disabled ? `已完成：${t.completedAt?.replace('T', ' ').slice(0, 19)}` : '未完成'),
      React.createElement('button', { disabled, onClick: () => onMarkDone(t.id) }, '标记完成')
    )
  }

  function renderList() {
    return React.createElement(
      'div',
      null,
      React.createElement('h2', null, '任务列表'),
      React.createElement('ul', { style: { display: 'grid', gap: 6, padding: 0, listStyle: 'none' } }, tasks.map(renderTaskItem))
    )
  }

  function renderStats() {
    return React.createElement(
      'div',
      null,
      React.createElement('h2', null, '统计'),
      React.createElement('p', null, `本日完成任务数：${todayCount}`)
    )
  }

  return React.createElement(
    'div',
    { style: { fontFamily: 'system-ui, sans-serif', padding: 24 } },
    React.createElement('h1', null, '任务记录程序'),
    React.createElement('p', null, `Ping: ${pong || '...'}`),
    versions
      ? React.createElement(
          'ul',
          null,
          React.createElement('li', null, `Node: ${versions.node}`),
          React.createElement('li', null, `Chrome: ${versions.chrome}`),
          React.createElement('li', null, `Electron: ${versions.electron}`)
        )
      : null,
    renderForm(),
    renderStats(),
    renderList()
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(React.createElement(App))
}