# Fullstack Engineering Take-Home Assignment

## Smart To-Do List (Dependency-Aware)

Thank you for taking the time to complete this assignment.
The goal is to assess how you architect a fullstack application, model data, implement dependency logic, and build a usable interface.

We care most about your approach, reasoning, and code quality.

## The Challenge

Build a Smart To-Do List web app that models tasks and their dependencies. Tasks can depend on other tasks, and the system must enforce dependency rules that determine which tasks are actionable and which are blocked.

You are building the entire stack: database, backend, and frontend.

You may use **any language and framework** for both the backend and frontend. However, we prefer **Python (Django)** for the backend and **React** for the frontend, as these align with our stack.


## Core Concepts

### Task States

A task can be in one of the following states:

- `todo` - Ready to be worked on
- `in_progress` - Currently being worked on
- `done` - Completed
- `blocked` - Cannot be worked on due to incomplete dependencies

### Dependency Rules

1. **Blocking vs actionable**
   - A task is **blocked** if **any** of its dependencies is **not** `done`.
   - A task is **actionable** if it has no dependencies, or **all** of its dependencies are `done`.

2. **Automatic transitions**
   - When a task becomes actionable and its current state is `blocked`, it must automatically transition to `todo`.
   - When a task becomes blocked (because any dependency is no longer `done`), it must automatically transition to `blocked`, regardless of its current state.

3. **User-driven transitions**
   - Users may move an actionable task between `todo`, `in_progress`, and `done`.
   - Users **cannot** directly set a task to `blocked`; that state is derived from dependencies.
   - Users **cannot** change the state of a `blocked` task.

4. **Propagation**
   - State changes must propagate **recursively** through all downstream dependents.
   - Propagation should occur **immediately** after any state change, until the system reaches a stable state.

5. **Multiple dependencies**
   - A task may have any number of dependencies. All rules above apply regardless of count.

6. **Reasonable simplification**
   - If a dependent task is already `done` and one of its dependencies reverts to a non-`done` state, the dependent must become `blocked`. This avoids "phantom completions" where a task is marked `done` but its prerequisites are no longer satisfied, keeping the dependency graph in a consistently valid state.

7. **No circular dependencies**
   - Adding a dependency that would create a cycle must be detected and rejected.
   - See the [Circular Dependencies](#circular-dependencies) section below for details.

### How Dependencies Work

The following example illustrates the dependency rules and propagation.

**Setup** - Three tasks with a dependency chain:

```
  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
  │  A: Setup DB  │───▶│ B: Build API  │───▶│ C: Write Docs │
  │    (todo)     │     │   (blocked)   │     │   (blocked)   │
  └───────────────┘     └───────────────┘     └───────────────┘

  B depends on A.  C depends on B.
  A has no dependencies, so it is actionable.
  B and C are blocked because their dependencies are not done.
```

**Step 1** - User marks A as `done`. Propagation kicks in:

```
  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
  │  A: Setup DB  │───▶│ B: Build API  │───▶│ C: Write Docs │
  │    (done)     │     │    (todo)     │     │   (blocked)   │
  └───────────────┘     └───────────────┘     └───────────────┘

  A is done → B's only dependency is satisfied → B auto-transitions to todo.
  C remains blocked because B is not done yet.
```

**Step 2** - User marks B as `done`. Propagation continues:

```
  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
  │  A: Setup DB  │───▶│ B: Build API  │───▶│ C: Write Docs │
  │    (done)     │     │    (done)     │     │    (todo)     │
  └───────────────┘     └───────────────┘     └───────────────┘

  B is done → C's only dependency is satisfied → C auto-transitions to todo.
  All tasks are now actionable.
```

**Step 3** - User reverts A back to `todo`. Propagation cascades downstream:

```
  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
  │  A: Setup DB  │───▶│ B: Build API  │───▶│ C: Write Docs │
  │    (todo)     │     │   (blocked)   │     │   (blocked)   │
  └───────────────┘     └───────────────┘     └───────────────┘

  A is no longer done → B becomes blocked (dependency unsatisfied).
  B is no longer done → C becomes blocked (dependency unsatisfied).
  Both B and C revert to blocked, even though C was previously todo.
```

**Multiple dependencies** - A task with more than one dependency:

```
  ┌───────────────┐
  │  A: Setup DB  │──────────┐
  │    (done)     │          │
  └───────────────┘          ▼
                       ┌───────────────┐
                       │ C: Deploy App │
                       │   (blocked)   │
  ┌───────────────┐    └───────────────┘
  │ B: Build API  │          ▲
  │ (in_progress) │──────────┘
  └───────────────┘

  C depends on both A and B.
  A is done, but B is not → C remains blocked.
  C only becomes actionable when ALL dependencies (A and B) are done.
```

### Circular Dependencies

A circular dependency occurs when a chain of dependencies loops back on itself. This creates a deadlock where no task in the cycle can ever become actionable, since each one is waiting on another.

```
  ┌───────────┐     ┌───────────┐     ┌───────────┐
  │     A     │───▶│     B     │───▶│     C     │
  └───────────┘     └───────────┘     └───────────┘
        ▲                                   │
        └───────────────────────────────────┘
                      (cycle!)

  A depends on B, B depends on C, C depends on A.
  No task in this chain can ever be completed
  because each one is permanently waiting on another.
```

If a user attempts to add a dependency that would introduce a cycle, the system must reject it and communicate the reason clearly to the user.

## Requirements

### Backend

1. Use a **relational database** for persistent storage (e.g., PostgreSQL, MySQL, SQLite).
2. Support the following capabilities:
   - Create, read, update, and delete tasks (title, description, due date, state)
   - Add and remove dependencies between tasks
   - Change task state, with the dependency rules enforced
   - List tasks, with the ability to filter by state
3. Implement or delegate the dependency rules described above. If delegation is your choice (e.g., to the frontend), justify it in your README.
4. Handle error cases gracefully and return meaningful error responses.

You choose the architecture. This could be a decoupled API (e.g., FastAPI + React), a monolithic framework with server-rendered templates (e.g., Django MVT, Rails MVC), or any other approach. Document your choice and reasoning in your README.

### Frontend

1. Display a list of all tasks with their title and current state.
2. Filter tasks by state (`todo`, `in_progress`, `done`, `blocked`).
3. Create and edit tasks (at minimum: title and state).
4. Add and remove dependencies between tasks.
5. Change task state via the UI, respecting the dependency rules.
6. Clearly indicate which tasks are blocked and what they are blocked by.
7. Keep code clean, modular, and readable.

### Optional Enhancements

These are genuinely optional. They won't penalize you if absent, but a well-executed enhancement can strengthen your submission.

- Dependency visualization (e.g., a graph or tree view showing the dependency chain).
- Tests (unit, integration, or end-to-end) for either or both layers.
- Due date handling (display, sort, or factor into task priority).

### Out of Scope

- Authentication or authorization.
- Real-time updates (WebSocket, SSE, polling).
- Routing complexity or pixel-perfect design.

## Constraints and Expectations

- **Timeline**: You have **one week** from receiving this assignment to submit. We respect your time -- aim for a focused, well-reasoned solution rather than exhaustive polish.
- **Stack flexible**: Use whatever backend language and framework you are most productive in. We prefer Python (Django or FastAPI) and React, but it is not a requirement.
- **Docker**: The entire application must run via `docker compose up`. This includes the database and the application (whether that is a single monolith or separate backend and frontend services).
- **State machine ownership**: You decide whether the dependency logic lives in the backend, the frontend, or both. Document your reasoning.
- **No seed data**: The database starts empty. The reviewer will create tasks and dependencies through your UI.

## What We Evaluate

| Area                    | What we look for                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Architecture**        | Data modeling, separation of concerns, layer boundaries, and architectural decisions (monolith vs decoupled, etc.) |
| **State machine logic** | Correctness of dependency rules and recursive propagation. Where the logic lives and why                           |
| **Code quality**        | Readability, typing, modularity, naming, minimal coupling                                                          |
| **UI/UX clarity**       | Easy to see task states, manage dependencies, and filter. Styling can be minimal                                   |
| **DevOps**              | `docker compose up` works cleanly, migrations run, app starts without manual intervention                          |
| **Testing**             | Optional, but well-written tests are a positive signal                                                             |
| **Communication**       | README quality (see below)                                                                                         |

## Submission

1. Share a repository (GitHub, GitLab, or Bitbucket).
2. Include a **README.md** that covers:
   - How to run the project (`docker compose up` and any other details)
   - Your tech stack and architecture choices and why (monolith vs decoupled, etc.)
   - Your approach to dependency evaluation and propagation
   - Where the state machine logic lives and your reasoning
   - Data model and any notable design decisions
   - Assumptions and trade-offs
   - What you would improve given more time
