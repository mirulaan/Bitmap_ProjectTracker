# HTTP Controllers Package Contract

## Overview
The `app/Http/Controllers` component contains HTTP endpoint controllers mediating interactions between the Blade frontend interface and underlying domain services. It coordinates project configuration, task CRUD lifecycle events, administrative phase/group setup, comment logging, and file attachment streaming.

## Interface
- `App\Http\Controllers\AttachmentController`:
  - `store(Request $request)`: Uploads new file attachment linked to project and optional task.
  - `download(string $id)`: Streams stored binary attachment file with appropriate MIME headers.
  - `destroy(string $id)`: Deletes attachment record and purges physical file from storage.
- `App\Http\Controllers\CommentController`:
  - `store(Request $request)`: Appends activity or progress comment to project or specific task.
- `App\Http\Controllers\Controller`: Base Laravel controller.
- `App\Http\Controllers\ProjectController`:
  - `index(Request $request)`: Renders main workspace view (`tracker.blade.php`) filtered by active tab (`dashboard`, `tasks`, `gantt`, `reports`, `setup`).
  - `update(Request $request)`: Updates primary project metadata (name, customer, manager, dates, settings).
  - `exportJson()`: Emits downloadable JSON snapshot of active project and all relational entities.
  - `importJson(Request $request)`: Deserializes uploaded JSON snapshot and replaces active project dataset.
  - `newFromTemplate()`: Wipes current project and seeds factory default sample project.
- `App\Http\Controllers\SetupController`:
  - `addPhase(Request $request)`, `deletePhase(string $id)`: Manages project lifecycle phases.
  - `addGroup(Request $request)`, `deleteGroup(string $id)`: Manages organizational functional groups.
  - `addUser(Request $request)`, `deleteUser(string $id)`: Manages team personnel assignments.
- `App\Http\Controllers\TaskController`:
  - `store(Request $request)`: Creates or updates task definition, milestone flags, and dependencies.
  - `quickStatus(Request $request, string $id)`: Fast status toggle directly from task table or Gantt view.
  - `destroy(string $id)`: Removes task and cascading child relationships.

## Invariants
- `ProjectController::index`: Guarantees active project availability by triggering fallback seeder if database is unseeded.
- `TaskController::quickStatus`: Automatically sets `progress = 100` when `status` transitions to `'Completed'`.
- All mutation endpoints validate string IDs against existing foreign keys.
- Input requests require CSRF token validation when accessed via web routes.

## Side Effects
- Mutates records in database tables (`projects`, `tasks`, `phases`, `groups`, `team_users`, `comments`, `attachments`).
- Writes to and removes files from `storage/app/private/attachments`.
- Issues session flash status messages on redirect.

## Verification
- Run: `php artisan test`
