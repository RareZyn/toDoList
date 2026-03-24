const BASE_URL = 'http://localhost:8000'

async function request(path, options = {}) {
  const response = await fetch(BASE_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json()

  if (!response.ok) {
    const message = data.detail || data.error || JSON.stringify(data)
    throw new Error(message)
  }

  return data
}

export function getTasks(filterState) {
  const query = filterState && filterState !== 'all' ? `?state=${filterState}` : ''
  return request(`/api/tasks/${query}`)
}

export function getTask(id) {
  return request(`/api/tasks/${id}/`)
}

export function createTask(data) {
  return request('/api/tasks/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTask(id, data) {
  return request(`/api/tasks/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteTask(id) {
  return request(`/api/tasks/${id}/`, {
    method: 'DELETE',
  })
}

export function changeTaskState(id, newState) {
  return request(`/api/tasks/${id}/change_state`, {
    method: 'POST',
    body: JSON.stringify({ state: newState }),
  })
}

export function addDependency(taskId, dependencyId) {
  return request(`/api/tasks/${taskId}/dependencies/`, {
    method: 'POST',
    body: JSON.stringify({ dependency_id: dependencyId }),
  })
}

export function removeDependency(taskId, depId) {
  return request(`/api/tasks/${taskId}/dependencies/${depId}/`, {
    method: 'DELETE',
  })
}
