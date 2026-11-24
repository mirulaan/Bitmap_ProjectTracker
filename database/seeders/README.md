# Database Seeders Package Contract

## Overview
The `database/seeders` component initializes application state with baseline demonstration datasets, factory sample project hierarchies, and industrial automation workflow templates.

## Interface
- `Database\Seeders\DatabaseSeeder`:
  - `run(): void`: Primary seeder entry point. Loads demonstration project if no records exist.
  - `seedFromData(array $data): Project`: Hydrates database from pre-packaged `project_data.json` payload.
  - `seedDefaultTemplate(): Project`: Hydrates database with default automation lifecycle template (PLC, Vision, Panel Assembly, FAT, Commissioning).

## Invariants
- Execution is idempotent: checks for existing project data before inserting records unless explicitly forced.
- Maintains full relational integrity across all generated tasks, phases, groups, and team members.

## Side Effects
- Inserts initial records into `projects`, `phases`, `groups`, `team_users`, and `tasks` tables.

## Verification
- Run: `php artisan db:seed --dry-run || php artisan test`
