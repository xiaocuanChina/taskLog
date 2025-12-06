/**
 * 项目选择视图组件
 * 
 * 功能说明:
 * - 应用的主入口视图,用于选择或创建项目
 * - 以网格形式展示所有项目卡片
 * - 提供创建新项目的功能
 * - 集成项目的编辑、删除和备忘管理功能
 * - 包含窗口控制栏和提示消息组件
 * - 使用渐变背景提升视觉效果
 * - 使用 Ant Design 布局组件实现响应式设计
 * 
 * 使用场景:
 * - 应用启动后的首页
 * - 项目管理和选择
 */
import React from 'react'
import { Button, Row, Col, Empty } from 'antd'
import { PlusOutlined, FolderOpenOutlined } from '@ant-design/icons'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import WindowControls from '../common/WindowControls'
import ProjectCard from './ProjectCard'
import ProjectModal from './ProjectModal'
import ProjectMemoModal from './ProjectMemoModal'
import ConfirmModal from '../common/ConfirmModal'
export default function ProjectSelectView({
  projects,
  showAddProjectModal,
  showDeleteProjectConfirm,
  showProjectMemoModal,
  newProjectName,
  projectToDelete,
  editingProjectMemo,
  onSelectProject,
  onAddProject,
  onUpdateProjectName,
  onDeleteProject,
  onProjectNameChange,
  onCreateProject,
  onConfirmDeleteProject,
  onCancelDeleteProject,
  onProjectMemoChange,
  onUpdateProjectMemo,
  onCloseProjectMemoModal,
  onCloseAddProjectModal,
  onProjectsReorder
}) {
  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 拖动8px后才激活,避免误触
      },
    })
  )

  // 处理拖拽结束
  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = projects.findIndex(p => p.id === active.id)
      const newIndex = projects.findIndex(p => p.id === over.id)
      
      const newProjects = arrayMove(projects, oldIndex, newIndex)
      onProjectsReorder(newProjects)
    }
  }
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      
      <WindowControls title="任务日志" />

      <main style={{ flex: 1, padding: '40px', paddingTop: '80px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#fff', margin: 0 }}>📂 选择或创建项目</h1>
          <Button 
            type="primary" 
            size="large"
            icon={<PlusOutlined />}
            onClick={onAddProject}
          >
            创建新项目
          </Button>
        </div>

        {projects.length === 0 ? (
          <Empty
            image={<FolderOpenOutlined style={{ fontSize: 80, color: 'rgba(255,255,255,0.3)' }} />}
            description={<span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>暂无项目，请创建一个新项目</span>}
            style={{ padding: '80px 0' }}
          />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
              <Row gutter={[24, 24]}>
                {projects.map(project => (
                  <Col key={project.id} xs={24} sm={12} md={8} lg={6}>
                    <ProjectCard
                      project={project}
                      onSelect={onSelectProject}
                      onUpdateName={onUpdateProjectName}
                      onDelete={onDeleteProject}
                    />
                  </Col>
                ))}
              </Row>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* 创建项目模态框 */}
      <ProjectModal
        show={showAddProjectModal}
        isEdit={false}
        projectName={newProjectName}
        onNameChange={onProjectNameChange}
        onConfirm={onCreateProject}
        onCancel={onCloseAddProjectModal}
      />

      {/* 删除项目确认模态框 */}
      <ConfirmModal
        show={showDeleteProjectConfirm}
        title="⚠️ 确认删除"
        message={`确定要删除项目「${projectToDelete?.name}」吗？`}
        warning="注意：只有完成所有任务的项目才能删除。删除后项目下的所有已完成任务、模块和图片都会被清除，此操作无法撤销。"
        onConfirm={onConfirmDeleteProject}
        onCancel={onCancelDeleteProject}
      />

      {/* 项目备忘模态框 */}
      <ProjectMemoModal
        show={showProjectMemoModal}
        memo={editingProjectMemo?.memo || ''}
        projectName={editingProjectMemo?.name || ''}
        onMemoChange={onProjectMemoChange}
        onConfirm={onUpdateProjectMemo}
        onCancel={onCloseProjectMemoModal}
      />
    </div>
  )
}
