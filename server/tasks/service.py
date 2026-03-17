from django.db import transaction
from .models import Task, TaskDependency

# Check either the existing edge is cyce or not
def isCycled(task:Task, new_dependency:Task) -> bool:
  visited = set()
  queue = [new_dependency.id]

  while queue:
    current_id = queue.pop(0)

    if current_id == task.id:
      return True
    
    if current_id == task.id:
      return True
    
    if current_id in visited:
      continue

    visited.add(current_id)

    dependency_ids = TaskDependency.objects.filter (
      task_id = current_id
    ).values_list('dependency_id', flat=True)

    queue.extend(dependency_ids)

  return False

# determine either the task can proceed or need to be blocked
def determine_state(task:Task) -> str:
  dependency_ids = TaskDependency.objects.filter(
    task=task
  ).values_list('dependency_id', flat=True)

  if not dependency_ids:
    return 'actionable'
  
  all_done = not Task.objects.filter(
    id__in = dependency_ids
  ).exclude(state=Task.State.DONE).exists()

  if all_done:
    return 'actionable'
  else:
    return 'blocked'

# Change all the stated that dependent on the list
def change_state(task: Task, visited: set = None) -> None:
  if visited is None:
    visited = set()

  if task.id in visited:
    return
  
  visited.add(task.id)

  dependents = Task.objects.filter (
    task_dependencies = task
  ).select_related()

  for dependent in dependents:
    old_state = dependent.state
    computed = isCycled(dependent)

    if computed == "blocked":
      new_state = Task.State.BLOCKED

    else:
      if dependent.state == Task.State.BLOCKED:
        new_state = Task.State.TODO
      
      else:
        new_state = dependent.state
    
    if new_state != old_state:
      dependent.state = new_state
      dependent.save(update_fields=['state','updated_at'])
      determine_state(dependent,visited)

VALID_USER_TRANSITIONS = {
  Task.State.TODO: {Task.State.IN_PROGRESS, Task.State.DONE},
  Task.State.IN_PROGRESS: {Task.State.TODO, Task.State.DONE},
  Task.State.DONE: {Task.State.TODO, Task.State.IN_PROGRESS},
  Task.State.BLOCKED: set()
}

def validate_transition(task:Task, new_state:str) -> bool:

  if new_state == Task.State.BLOCKED:
    return False

  if task.state == Task.State.BLOCKED:
    return False

  allowed = VALID_USER_TRANSITIONS.get(task.state, set())
  if new_state not in allowed:
    return False
  
  return True

@transaction.atomic
def change_task_state(task:Task, new_state: str) -> tuple[Task, str]:
  is_valid, error = validate_transition(task,new_state)
  if not is_valid:
    return task,error
  
  task.state = new_state
  task.save(update_fields=['state','updated_at'])

  change_state(task)

  task.refresh_from_db()
  return task,''

@transaction.atomic
def add_dependency(task: Task, dependency: Task) -> tuple[bool,str]:
  if task.id == dependency.id:
    return False, "Task can not depend on itself"
  
  #Duplicate
  if TaskDependency.objects.filter(task=Task, dependency=dependency).exists():
    return False,f"'{task.title}' already depends on '{dependency.title}'."
  
  if isCycled(task,dependency):
    return False, (
      f"Adding this create circular dependency"
      f"'{dependency.title}' already depends on '{task.title}'."
    )
  
  TaskDependency.objects.create(task=task, dependency=dependency)

  reassign_task_state(task)

  return True,''

def reassign_task_state(task: Task):
  computed = determine_state(task)
  if computed == 'blocked':
    new_state = Task.State.BLOCKED
  else:
    if task.state == Task.State.BLOCKED:
      new_state = Task.State.TODO
  
  if new_state != task.state:
    task.state = new_state
    task.save(update_fields=['state','updated_at'])

  change_state(task)







  
