function StateBadge({ state }) {
  return (
    <span className={`badge badge-${state}`}>
      {state.replace('_', ' ')}
    </span>
  )
}

export default function TaskCard({ task, onClick, onDelete }) {
  const dependencyCount = task.dependencies ? task.dependencies.length : 0

  function handleDeleteClick(event) {
    event.stopPropagation()
    onDelete(task.id)
  }

  return (
    <div className="task-card glass-card" onClick={() => onClick(task)}>
      <div className="task-card-header">
        <StateBadge state={task.state} />
        <button className="task-card-delete" onClick={handleDeleteClick} title="Delete task">
          ×
        </button>
      </div>

      <h3 className="task-card-title">{task.title}</h3>

      {task.description && (
        <p className="task-card-description">{task.description}</p>
      )}

      <div className="task-card-footer">
        {task.due_date && (
          <span className="task-card-due">
            Due {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
        {dependencyCount > 0 && (
          <span className="task-card-deps">
            {dependencyCount} {dependencyCount === 1 ? 'dep' : 'deps'}
          </span>
        )}
      </div>

      {task.state === 'blocked' && (
        <div className="task-card-blocked-bar">
          Waiting on unfinished tasks
        </div>
      )}
    </div>
  )
}
