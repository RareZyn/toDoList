import { useState } from 'react'

export default function TaskForm({ task, onCreate, onUpdate, onClose }) {
  const isEditing = task !== null && task !== undefined

  const [title, setTitle] = useState(isEditing ? task.title : '')
  const [description, setDescription] = useState(isEditing ? (task.description || '') : '')
  const [dueDate, setDueDate] = useState(isEditing ? (task.due_date || '') : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!title.trim()) {
      setError('Title is required.')
      return
    }

    setSaving(true)
    setError('')

    const data = {
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
    }

    try {
      if (isEditing) {
        await onUpdate(task.id, data)
      } else {
        await onCreate(data)
      }
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-field">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Due Date</label>
            <input
              className="form-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
