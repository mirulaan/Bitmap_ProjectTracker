# Database Migrations Package Contract

## Overview
The `database/migrations` component defines the relational schema DDL definitions for **Bitmap Project Tracker**. It manages table provisioning, column constraints, indexes, and cascading foreign keys across supported database engines (PostgreSQL and SQLite).

## Interface
- Migrations List:
  - `0001_01_01_000000_create_users_table.php`: DDL for `users`, `password_reset_tokens`, and `sessions` tables.
  - `0001_01_01_000001_create_cache_table.php`: DDL for `cache` and `cache_locks` tables.
  - `0001_01_01_000002_create_jobs_table.php`: DDL for `jobs`, `job_batches`, and `failed_jobs` tables.
  - `2026_11_20_000001_create_project_tables.php`: DDL for core project tables:
    - `projects`: `id` (PK, string), `name`, `customer`, `project_manager`, `start_date`, `end_date`, `settings` (JSON).
    - `phases`: `id` (PK, string), `project_id` (FK), `name`, `description`, `order`, `start_date`, `due_date`.
    - `groups`: `id` (PK, string), `project_id` (FK), `name`.
    - `team_users`: `id` (PK, string), `project_id` (FK), `name`, `role`, `group_id`, `email`, `active`.
    - `tasks`: `id` (PK, string), `project_id` (FK), `phase_id` (FK), `parent_id` (nullable), `title`, `description`, `assignee_ids` (JSON), `group_ids` (JSON), `start_date`, `due_date`, `duration_days`, `status`, `progress`, `priority`, `dependencies` (JSON), `attachment_ids` (JSON), `is_milestone`, `milestone_label`, `internal_notes`.
    - `comments`: `id` (PK, string), `project_id` (FK), `task_id` (nullable), `author`, `text`, `type`.
    - `attachments`: `id` (PK, string), `project_id` (FK), `file_name`, `stored_path`, `file_size`, `mime_type`, `uploaded_date`, `notes`, `added_by`.

## Invariants
- All primary keys use string identifiers to support offline-first client UUID generation.
- Foreign keys maintain cascading deletes referencing `projects.id`.
- Reversible schema transitions are enforced via standard `up()` and `down()` migration methods.

## Side Effects
- Mutates database DDL schemas and tracking table `migrations`.

## Verification
- Run: `php artisan migrate:status`
