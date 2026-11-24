# Blade Templates Package Contract

## Overview
The `resources/views` directory contains the presentation templates for **Bitmap Project Tracker**. It is organized into reusable base layouts, interactive modals, individual tab workspaces, and the root tracker view.

## Interface
- Core Templates:
  - `tracker.blade.php`: Root workspace view extending `layouts.app` and conditionally rendering the active tab (`dashboard`, `tasks`, `gantt`, `reports`, `setup`) alongside `modals.task_modal` and `modals.import_modal`.
- Subdirectories:
  - layouts: [./layouts/README.md](./layouts/README.md) - Application master layout, navigation bar, and offline asset links.
  - modals: [./modals/README.md](./modals/README.md) - Task creation/edit modal and JSON project import dialogs.
  - tabs: [./tabs/README.md](./tabs/README.md) - Individual tab screens for Dashboard, Tasks, Gantt, Reports, and Setup.

## Invariants
- All views extend or integrate with `layouts.app`.
- Tab state defaults to `dashboard` when `?tab=` query parameter is absent.
- Strict XSS protection via Blade's `{{ ... }}` escaping syntax for all user-supplied content.

## Side Effects
- Renders HTML response sent to user web browser.

## Verification
- Run: `php artisan test`
