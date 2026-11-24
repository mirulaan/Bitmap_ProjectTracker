# Application Routes Package Contract

## Overview
The `routes/` component defines the application routing contracts, URL mappings, HTTP verb bindings, and route group middleware for **Bitmap Project Tracker**.

## Interface
- Web Routes (`routes/web.php`):
  - `GET /`: `ProjectController::index` - Primary UI workspace.
  - `POST /project/update`: `ProjectController::update` - Modifies project header info.
  - `GET /project/export`: `ProjectController::exportJson` - Downloads project JSON backup.
  - `POST /project/import`: `ProjectController::importJson` - Restores project from uploaded JSON.
  - `POST /project/template`: `ProjectController::newFromTemplate` - Resets project to factory template.
  - `POST /tasks`: `TaskController::store` - Creates or updates task.
  - `PATCH /tasks/{id}/status`: `TaskController::quickStatus` - Quick status toggle.
  - `DELETE /tasks/{id}`: `TaskController::destroy` - Deletes task.
  - `POST /setup/phases`, `DELETE /setup/phases/{id}`: `SetupController` - Phase lifecycle.
  - `POST /setup/groups`, `DELETE /setup/groups/{id}`: `SetupController` - Group lifecycle.
  - `POST /setup/users`, `DELETE /setup/users/{id}`: `SetupController` - Personnel lifecycle.
  - `POST /comments`: `CommentController::store` - Creates comment.
  - `POST /attachments`: `AttachmentController::store` - Uploads attachment.
  - `GET /attachments/{id}/download`: `AttachmentController::download` - Streams file download.
  - `DELETE /attachments/{id}`: `AttachmentController::destroy` - Deletes attachment.
- API Routes (`routes/api.php`):
  - `GET /api/ping`: Telemetry agent and health heartbeat ping endpoint.
- Console Routes (`routes/console.php`):
  - Closure-based Artisan console commands.

## Invariants
- Web routes require session state, cookie encryption, and CSRF token verification.
- API routes return structured JSON responses and bypass session cookie requirements.
- Root route `GET /` accepts optional `?tab=` query parameter to route directly to `dashboard`, `tasks`, `gantt`, `reports`, or `setup`.

## Side Effects
- Dispatches HTTP requests to designated controllers.
- Logs access and modification events.

## Verification
- Run: `php artisan route:list`
