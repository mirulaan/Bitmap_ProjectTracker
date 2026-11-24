# Eloquent Models Package Contract

## Overview
The `app/Models` component defines the Eloquent ORM entity layer for **Bitmap Project Tracker**. It models industrial deployment lifecycles, hierarchical work breakdown structures, execution phases, team engineering groups, task discussions, and file attachments.

## Interface
- `App\Models\Project`:
  - `phases()`: HasMany `Phase`
  - `groups()`: HasMany `Group`
  - `teamUsers()`: HasMany `TeamUser`
  - `tasks()`: HasMany `Task`
  - `comments()`: HasMany `Comment`
  - `attachments()`: HasMany `Attachment`
- `App\Models\Task`:
  - `project()`: BelongsTo `Project`
  - `phase()`: BelongsTo `Phase`
  - `parent()`: BelongsTo `Task` (nullable parent task)
  - `children()`: HasMany `Task` (hierarchical subtasks)
  - `comments()`: HasMany `Comment`
- `App\Models\Phase`:
  - `project()`: BelongsTo `Project`
  - `tasks()`: HasMany `Task`
- `App\Models\Group`:
  - `project()`: BelongsTo `Project`
- `App\Models\TeamUser`:
  - `project()`: BelongsTo `Project`
  - `group()`: BelongsTo `Group`
- `App\Models\Comment`:
  - `project()`: BelongsTo `Project`
  - `task()`: BelongsTo `Task`
- `App\Models\Attachment`:
  - `project()`: BelongsTo `Project`

## Invariants
- All primary keys are string IDs (`$table->string('id')->primary()`), typically UUIDs or prefixed IDs (e.g. `task_1711000000_123`).
- Foreign key cascading deletion is enforced across all tables against `projects.id`.
- Task `status` values conform to: `'Not Started'`, `'In Progress'`, `'Blocked / On Hold'`, `'Pending Review'`, `'Completed'`.
- Task `priority` values conform to: `'Low'`, `'Medium'`, `'High'`, `'Critical'`.
- JSON-casted fields:
  - `Task::$casts`: `assignee_ids` => `array`, `group_ids` => `array`, `dependencies` => `array`, `attachment_ids` => `array`, `is_milestone` => `boolean`.
  - `Project::$casts`: `settings` => `array`.

## Side Effects
- Reads and writes application state via database connection configured by `DB_CONNECTION` (`pgsql` or `sqlite`).

## Verification
- Run: `php artisan test`
