const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
]

export default function FilterBar({ filter, onFilterChange }) {
  return (
    <div className="filter-bar">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`filter-pill ${filter === option.value ? 'filter-pill-active' : ''}`}
          onClick={() => onFilterChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
