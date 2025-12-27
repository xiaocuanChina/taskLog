import { useState, useRef, useEffect } from 'react'

// 任务模态框自定义 Hook
export function useTaskModal(taskTypes = []) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const [showModuleDropdown, setShowModuleDropdown] = useState(false)
  const [showEditModuleDropdown, setShowEditModuleDropdown] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showEditTypeDropdown, setShowEditTypeDropdown] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [newTask, setNewTask] = useState({
    module: '',
    name: '',
    type: taskTypes[0]?.name || '', // 默认任务类型，自动取第一个
    initiator: '',
    remark: '',
    images: [],
    codeBlock: {
      enabled: false,
      language: 'javascript',
      code: ''
    },
    checkItems: {
      enabled: false,
      mode: 'multiple',
      items: [],
      newItemName: ''
    }
  })
  const [editingTask, setEditingTask] = useState(null)

  // 当 taskTypes 加载完成后，更新默认任务类型
  useEffect(() => {
    if (taskTypes.length > 0 && !newTask.type) {
      setNewTask(prev => ({
        ...prev,
        type: taskTypes[0].name
      }))
    }
  }, [taskTypes])

  // 输入框 refs
  const addTaskModuleRef = useRef(null)
  const addTaskNameRef = useRef(null)
  const addTaskInitiatorRef = useRef(null)
  const addTaskRemarkRef = useRef(null)
  const editTaskModuleRef = useRef(null)
  const editTaskNameRef = useRef(null)
  const editTaskInitiatorRef = useRef(null)
  const editTaskRemarkRef = useRef(null)

  // 重置新任务表单
  const resetNewTaskForm = () => {
    setNewTask({ 
      module: '', 
      name: '', 
      type: taskTypes[0]?.name || '', // 重置为默认的任务类型，自动取第一个
      initiator: '', 
      remark: '', 
      images: [],
      codeBlock: {
        enabled: false,
        language: 'javascript',
        code: ''
      },
      checkItems: {
        enabled: false,
        mode: 'multiple',
        items: [],
        newItemName: ''
      }
    })
  }

  // 拖拽处理
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e, isEdit = false) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      if (isEdit) {
        setEditingTask(prev => ({ ...prev, images: [...prev.images, ...files] }))
      } else {
        setNewTask(prev => ({ ...prev, images: [...prev.images, ...files] }))
      }
    }
  }

  // 粘贴处理
  const handlePaste = (e, isEdit = false) => {
    const items = e.clipboardData?.items
    if (!items) return

    const files = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      if (isEdit) {
        setEditingTask(prev => ({ ...prev, images: [...prev.images, ...files] }))
      } else {
        setNewTask(prev => ({ ...prev, images: [...prev.images, ...files] }))
      }
    }
  }

  return {
    showAddTaskModal,
    setShowAddTaskModal,
    showEditTaskModal,
    setShowEditTaskModal,
    showModuleDropdown,
    setShowModuleDropdown,
    showEditModuleDropdown,
    setShowEditModuleDropdown,
    showTypeDropdown,
    setShowTypeDropdown,
    showEditTypeDropdown,
    setShowEditTypeDropdown,
    dragActive,
    setDragActive,
    newTask,
    setNewTask,
    editingTask,
    setEditingTask,
    resetNewTaskForm,
    handleDrag,
    handleDrop,
    handlePaste,
    taskRefs: {
      moduleRef: addTaskModuleRef,
      nameRef: addTaskNameRef,
      initiatorRef: addTaskInitiatorRef,
      remarkRef: addTaskRemarkRef
    },
    editTaskRefs: {
      moduleRef: editTaskModuleRef,
      nameRef: editTaskNameRef,
      initiatorRef: editTaskInitiatorRef,
      remarkRef: editTaskRemarkRef
    }
  }
}
