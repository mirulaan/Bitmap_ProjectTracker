# Blade Workspace Tabs Package Contract

## Overview
The `resources/views/tabs` directory houses the core workspace tab views providing executive dashboards, hierarchical task management, interactive Gantt charts, print-ready reports, and system setup configurations.

## Interface
- Tab Templates:
  - `dashboard.blade.php`: Executive overview containing overall project progress gauge, status cards, phase delivery progress bars, task status distribution Chart.js donut, overdue alerts list, and milestone tracking.
  - `tasks.blade.php`: Work breakdown structure table categorized by phases, supporting inline quick-status changes, subtask expanding, filter search, and task modal invocation.
  - `task_row.blade.php`: Recursive subtask row template providing indented rendering for nested task hierarchies.
  - `gantt.blade.php`: Interactive visual Gantt timeline with dependency curve drawing, zoom levels (Days, Weeks, Months), critical path markers, and today-line indicators.
  - `reports.blade.php`: Printable report generator formatting Executive Summaries, Phase Work Breakdowns, Critical Path Logs, and Client Status Briefs.
  - `setup.blade.php`: Administrative management interface for project metadata, phases, functional groups, and personnel rosters.

## Invariants
- All tab views receive `$project`, `$stats`, `$phases`, `$tasks`, `$groups`, and `$teamUsers` from `ProjectController::index`.
- Recursive `task_row` rendering maintains cycle-safe hierarchy traversal.
- Print layouts in `reports.blade.php` include `@media print` CSS rules for clean pagination.

## Side Effects
- Renders interactive SVG/Canvas charts and DOM elements.
- Interacts with backend controller routes via standard HTML form POST/PATCH/DELETE actions.

## Verification
- Run: `php artisan test`
