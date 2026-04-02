# Smart To-Do List (Rooftop Energy)

---

## Run the project

```bash
git clone <repo-url>
cd toDoList
docker compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173  |
| Backend  | http://localhost:8000  |


---

## Technology and framework that I used

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React                             |
| Backend  | Django                            |
| Database | PostgreSQL                        |
| Server   | Nginx                             |
| DevOps   | Docker, Docker Compose            |

---

## Architecture

**Decoupled API.**

The backend using REST Api and the frontend is just single page frontend.It using HTTP with JSON.

**Why I'm using decoupled over Django MVT that already combine frontend and backend?**

- Because I want to using clear structure between frontend and backend.
- Easier to debug when testing.

---

## Dependency Logic

**All dependency in the backend.**, in [`server/tasks/service.py`](server/tasks/service.py).

**Why backend, not frontend?**

Dependency rules is server side so I can apply the rule with atomic to test the depedency cycle. Eventhough user can only change it in the frontend but still provide with strict rule to avoid any error and its good practice to testing each possible situation.


---

### State Rules

4 states: `todo`, `in_progress`, `done`, `blocked`.

- The task is **blocked** if any of its dependencies is not `done`.
- The task is **actionable** if it has no dependencies, or all dependencies are `done`.
- `blocked` is a derived state — users cannot set it directly, and cannot change the state of a blocked task.

### Transitions

```
todo        → in_progress, done
in_progress → todo, done
done        → todo, in_progress
blocked     → read-only
```

### Propagation Algorithm (How the change state for each task works)

When a task want to change it's state it will go to function `change_state()` in `service.py` go through all the nodes dependents:

1. Each dependent, check either it should be `blocked` or `actionable` based on current dependency states.
2. If the new computed state differents from the current state, update it back
3. A `visited` set prevents infinite loops.
4. All state changes within a single user action are wrapped in a `@transaction.atomic` block


### Cycle Detection

Before adding a dependency, `isCycled()` performs a BFS traversal starting from the head, walking its own dependency chain. If it reaches the original task, a cycle would be created so the operation is rejected with a clear error message.

---

## Data Model

### `Task`

| Field        | Type                     |
|--------------|--------------------------|
| `id`         | BigAutoField             | 
| `title`      | CharField                | 
| `description`| TextField                | 
| `due_date`   | DateField                | 
| `state`      | CharField                | 
| `created_at` | DateTimeField            | 
| `updated_at` | DateTimeField            | 
| `dependencies` | ManyToManyField (self) |

### `TaskDependency`

| Field         | Type          | 
|---------------|---------------|
| `id`          | BigAutoField  |
| `task`        | ForeignKey    |
| `dependency`  | ForeignKey    |
| `created_at`  | DateTimeField |

Unique on `(task, dependency)` prevents duplicate edges.


## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List all tasks. Supports `?state=` filter. |
| POST | `/api/tasks/` | Create a task. |
| GET | `/api/tasks/<id>/` | Retrieve a task. |
| PATCH | `/api/tasks/<id>/` | Update task fields. |
| DELETE | `/api/tasks/<id>/` | Delete a task. |
| POST | `/api/tasks/<id>/change_state` | Transition task state. |
| POST | `/api/tasks/<id>/dependencies/` | Add a dependency. |
| DELETE | `/api/tasks/<id>/dependencies/<dep_id>/` | Remove a dependency. |

---


## What I Would Improve Given More Time

1. **Tests.** I just use postman to do the testing for each API endpoints but its better if I can provide with unit test.
2. **Due date sorting and overdue indicators.** The `due_date` field is stored and displayed but not used for sorting or indicates if the task is already due based on current date.
3. **UI updates.** The Ui is just simple table but its better if it can visualize how the task depends on other task like provide in graph.
