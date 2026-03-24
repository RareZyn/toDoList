import { useState } from 'react'

function StateBadge({ state }) {
  return (
    <span className={`badge badge-${state}`}>
      {state.replace('_', ' ')}
    </span>
  )
}

const STATE_TRANSITIONS = {
  todo: [
    { label: 'Start', newState: 'in_progress' },
    { label: 'Mark Done', newState: 'done' },
  ],
  in_progress: [
    { label: 'Pause', newState: 'todo' },
    { label: 'Mark Done', newState: 'done' },
  ],
  done: [
    { label: 'Reopen', newState: 'todo' },
    { label: 'Restart', newState: 'in_progress' },
  ],
  blocked: [],
}

export default function TaskDetail({
  task,
  allTasks,
  onStateChange,
  onAddDep,
  onRemoveDep,
  onEdit,
  onDelete,
  onClose,
}) {
  const [selectedDepId, setSelectedDepId] = useState('')
  const [depError, setDepError] = useState('')
  const [stateError, setStateError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const currentDepIds = task.dependencies ? task.dependencies.map((d) => d.id) : []

  const availableToAdd = allTasks.filter((t) => {
    const isNotSelf = t.id !== task.id
    const isNotAlreadyDep = !currentDepIds.includes(t.id)
    return isNotSelf && isNotAlreadyDep
  })

  const blockingTasks = task.dependencies
    ? task.dependencies.filter((dep) => dep.state !== 'done')
    : []

  async function handleStateChange(newState) {
    setStateError('')
    try {
      await onStateChange(task.id, newState)
    } catch (err) {
      setStateError(err.message)
    }
  }

  async function handleAddDep() {
    if (!selectedDepId) return
    setDepError('')
    try {
      await onAddDep(task.id, parseInt(selectedDepId))
      setSelectedDepId('')
    } catch (err) {
      setDepError(err.message)
    }
  }

  async function handleRemoveDep(depId) {
    setDepError('')
    try {
      await onRemoveDep(task.id, depId)
    } catch (err) {
      setDepError(err.message)
    }
  }

  async function handleDelete() {
    await onDelete(task.id)
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const transitions = STATE_TRANSITIONS[task.state] || []

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-panel modal-panel-wide">
        <div className="modal-header">
          <div className="modal-header-left">
            <StateBadge state={task.state} />
            <h2 className="modal-title">{task.title}</h2>
          </div>
          <div className="modal-header-right">
            <button className="btn-ghost" onClick={onEdit}>Edit</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-body">
          {task.description && (
            <p className="detail-description">{task.description}</p>
          )}

          {task.due_date && (
            <p className="detail-meta">
              Due: {new Date(task.due_date).toLocaleDateString()}
            </p>
          )}

          <div className="detail-section">
            <h4 className="detail-section-title">Change State</h4>

            {task.state === 'blocked' ? (
              <div className="blocked-notice">
                <p className="blocked-notice-text">
                  This task is blocked. It will become available once all dependencies are done.
                </p>
                {blockingTasks.length > 0 && (
                  <ul className="blocked-list">
                    {blockingTasks.map((dep) => (
                      <li key={dep.id} className="blocked-list-item">
                        <span>{dep.title}</span>
                        <StateBadge state={dep.state} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="state-actions">
                {transitions.map((transition) => (
                  <button
                    key={transition.newState}
                    className="btn-secondary"
                    onClick={() => handleStateChange(transition.newState)}
                  >
                    {transition.label}
                  </button>
                ))}
              </div>
            )}

            {stateError && <p className="form-error">{stateError}</p>}
          </div>

          <div className="detail-section">
            <h4 className="detail-section-title">Dependencies</h4>
            <p className="detail-section-hint">
              This task waits on these tasks to be done before it can proceed.
            </p>

            {task.dependencies && task.dependencies.length > 0 ? (
              <ul className="dep-list">
                {task.dependencies.map((dep) => (
                  <li key={dep.id} className="dep-item">
                    <div className="dep-item-left">
                      <span className="dep-item-title">{dep.title}</span>
                      <StateBadge state={dep.state} />
                    </div>
                    <button
                      className="dep-remove"
                      onClick={() => handleRemoveDep(dep.id)}
                      title="Remove dependency"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="detail-empty">No dependencies yet.</p>
            )}

            {availableToAdd.length > 0 && (
              <div className="dep-add-row">
                <select
                  className="form-input dep-select"
                  value={selectedDepId}
                  onChange={(e) => setSelectedDepId(e.target.value)}
                >
                  <option value="">Select a task to depend on...</option>
                  {availableToAdd.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.state.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <button
                  className="btn-secondary"
                  onClick={handleAddDep}
                  disabled={!selectedDepId}
                >
                  Add
                </button>
              </div>
            )}

            {depError && <p className="form-error">{depError}</p>}
          </div>

          <div className="detail-section detail-danger">
            {showDeleteConfirm ? (
              <div className="delete-confirm-card">
                <p className="delete-confirm-text">
                  Delete <strong>{task.title}</strong>? This cannot be undone.
                </p>
                <div className="delete-confirm-actions">
                  <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </button>
                  <button className="btn-danger" onClick={handleDelete}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            ) : (
              <button className="btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete Task
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
