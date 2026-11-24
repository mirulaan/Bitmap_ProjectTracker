# Blade Modals Package Contract

## Overview
The `resources/views/modals` component contains interactive modal dialog overlays for task authoring and project backup import.

## Interface
- `resources/views/modals/task_modal.blade.php`:
  - Comprehensive task creation and editing modal dialog.
  - Form fields: Title, Phase selector, Parent Task hierarchy selector, Assigned Engineers multi-select, Functional Groups, Start & Due Dates, Duration in Days, Status, Progress (0-100 slider), Priority (Low/Medium/High/Critical), Milestone checkbox & label, Dependency task select, and Internal Notes.
- `resources/views/modals/import_modal.blade.php`:
  - Modal form for uploading project JSON backup snapshots to `POST /project/import`.

## Invariants
- Form submissions require `@csrf` tokens.
- Parent task selector dynamically excludes the current task and its descendants to avoid hierarchy loops in UI.
- Progress slider automatically syncs with status (100% on Completed).

## Side Effects
- Dispatches form submissions to `TaskController::store` and `ProjectController::importJson`.

## Verification
- Run: `php artisan test`
