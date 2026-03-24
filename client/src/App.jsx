import { useState, useEffect } from 'react'
import './App.css'
import { getTasks, createTask, updateTask, deleteTask, changeTaskState, addDependency, removeDependency, getTask } from './services/api.js'
import Navbar from './components/Navbar.jsx'
import FilterBar from './components/FilterBar.jsx'
import TaskCard from './components/TaskCard.jsx'
import TaskForm from './components/TaskForm.jsx'
import TaskDetail from './components/TaskDetail.jsx'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  useEffect(() => {
    loadTasks()
  }, [filter])

  async function loadTasks() {
    setLoading(true)
    try {
      const data = await getTasks(filter)
      setTasks(data)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  async function refreshSelectedTask(taskId) {
    try {
      const fresh = await getTask(taskId)
      setSelectedTask(fresh)
    } catch {
      setSelectedTask(null)
    }
  }

  async function handleCreate(data) {
    await createTask(data)
    await loadTasks()
  }

  async function handleUpdate(id, data) {
    await updateTask(id, data)
    await loadTasks()
    await refreshSelectedTask(id)
  }

  async function handleDelete(id) {
    await deleteTask(id)
    setSelectedTask(null)
    await loadTasks()
  }

  async function handleStateChange(id, newState) {
    await changeTaskState(id, newState)
    await loadTasks()
    await refreshSelectedTask(id)
  }

  async function handleAddDep(taskId, depId) {
    await addDependency(taskId, depId)
    await loadTasks()
    await refreshSelectedTask(taskId)
  }

  async function handleRemoveDep(taskId, depId) {
    await removeDependency(taskId, depId)
    await loadTasks()
    await refreshSelectedTask(taskId)
  }

  function handleCardClick(task) {
    setSelectedTask(task)
  }

  function handleCloseDetail() {
    setSelectedTask(null)
  }

  function handleOpenEdit() {
    setEditingTask(selectedTask)
    setSelectedTask(null)
  }

  function handleCloseForm() {
    setShowCreateForm(false)
    setEditingTask(null)
  }

  const isFormOpen = showCreateForm || editingTask !== null

  return (
    <div id="app-root">
      <Navbar />

      <main>
        <div className="page-header">
          <div className="page-header-left">
            <FilterBar filter={filter} onFilterChange={setFilter} />
          </div>
          <button className="btn-create" onClick={() => setShowCreateForm(true)}>
            + New Task
          </button>
        </div>


        {loading ? (
          <div className="loading-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state-title">No tasks here yet.</p>
            <p className="empty-state-hint">
              {filter === 'all'
                ? 'Click "+ New Task" to create your first task.'
                : `No tasks with state "${filter.replace('_', ' ')}".`}
            </p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleCardClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {isFormOpen && (
        <TaskForm
          task={editingTask}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onClose={handleCloseForm}
        />
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          allTasks={tasks}
          onStateChange={handleStateChange}
          onAddDep={handleAddDep}
          onRemoveDep={handleRemoveDep}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}
