# Domain Services Package Contract

## Overview
The `app/Services` component contains core calculation algorithms, progress aggregation logic, and project serialization workflows for **Bitmap Project Tracker**. It abstracts state calculations away from HTTP controllers and presentation views.

## Interface
- `App\Services\ProjectService`:
  - `getActiveProject(): Project`: Retrieves the singleton active project; automatically runs `DatabaseSeeder::run()` if database is unseeded.
  - `computeStats(Project $project): array`: Computes high-level project metrics including:
    - Duration-weighted overall progress percentage (`overallProgress`).
    - Individual phase progress percentages (`phaseProgress`).
    - Overdue tasks collection (`overdue`).
    - Current week deliverables (`dueThisWeek`).
    - Blocked task indicators (`blocked`).
    - Milestones list (`milestones`).
    - Counts mapped by task status (`countsByStatus`).
  - `buildProgressMap(Collection $tasks): array`: Recursively rolls up subtask progress into parent task progress weighted by `max(1, duration_days)`.
  - `exportToJson(Project $project): array`: Maps relational database entities into a portable, structured JSON document for backup and migration.

## Invariants
- Prevents infinite recursion cycles in task hierarchies via visiting set tracking (`$visiting[$id]`).
- Task weighting defaults to a minimum of 1 day (`max(1, duration_days)`), ensuring zero-duration tasks still contribute proportionately.
- Leaf tasks directly report their own progress (`progress`), bounded between `0` and `100`.

## Side Effects
- Triggers database queries via Eloquent models.
- Can invoke `DatabaseSeeder` on cold database boot.

## Verification
- Run: `php artisan test`
