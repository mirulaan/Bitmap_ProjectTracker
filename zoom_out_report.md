# Initial Zoom-Out Review Report

**Target Document**: [/Users/macbookpro/Documents/macbookpro/VibeCode/Bitmap_ProjectTracker/README.md](file:///Users/macbookpro/Documents/macbookpro/VibeCode/Bitmap_ProjectTracker/README.md)  
**Standard**: `resources/document_standards/zoom-out-standard.md`  
**Reviewers**: `egm-zoom-out`, `egm-inventive-catalyst`

---

## 1. Findings by Zoom-Out Goldfish (`egm-zoom-out`)

### Finding 1.1: Speculative Data Flow & Architectural Fiction
- **Severity**: 🔴 Blocker
- **Affected Scope**: Lines 16, 18–28 (Mermaid Architecture Diagram), 72–73 (Global Side Effects), and Line 88 (Key Features)
- **Simplicity Rationale**:
  The diagram depicts a data flow where plant telemetry stations send `PowerShell HTTP POST /api/ping` through Nginx, PHP-FPM, Routes, Controllers, Domain Service, Models, and Database. This architecture does not exist in the codebase:
  1. In `routes/api.php`, the `/ping` route is strictly `GET /ping` returning `{"status": "ok"}`. An HTTP POST request will trigger HTTP 405 (Method Not Allowed).
  2. The route uses an inline closure; no Controller, `ProjectService`, Eloquent Model, or Database persistence is touched.
  3. There are zero database tables, migrations, or domain models handling hardware telemetry or forensic logs.
  4. Standalone scripts in `public/scripts/Push-Telemetry.ps1` actually attempt to POST to `/api/system-status` (an unrouted endpoint).
  - *Recommendation*: Eliminate speculative telemetry pipeline flows from the Mermaid diagram and documentation. Align descriptions with actual route behavior (`GET /api/ping` health check) or define the missing controller endpoints and storage schema if telemetry ingestion is in-scope.

### Finding 1.2: Architectural Anti-Pattern — Automatic Project Seeding in Domain Read Path
- **Severity**: 🟡 Major
- **Affected Scope**: Line 63 ("Automatic Project Seeding" under Global Invariants)
- **Simplicity Rationale**:
  The document codifies that `ProjectService::getActiveProject()` automatically executes `DatabaseSeeder::run()` whenever the database has zero projects. Triggering database write mutations and schema seeding during a standard HTTP GET retrieval query (`getActiveProject()`) is a known architectural anti-pattern violating Separation of Concerns. Database provisioning belongs exclusively to the deployment and CLI initialization lifecycle (`php artisan migrate --seed`), not buried inside domain accessors where unexpected state mutations can occur during normal runtime execution.

### Finding 1.3: Dead-End Configuration Boundary
- **Severity**: 🟢 Nit
- **Affected Scope**: Line 49 ("Subdirectories & System Boundaries - config")
- **Simplicity Rationale**:
  The directory boundary highlights "plant telemetry mappings" (`config/telemetry.php`). In code, `AppServiceProvider` attempts to invoke `PlantService::syncConfig()` from this configuration, but `PlantService` does not exist in the application (silently suppressed via an empty `try/catch` block). Documenting legacy or phantom configuration files at the system boundary level creates false architectural expectations.

### Finding 1.4: Speculative Tech Stack Claims (YAGNI)
- **Severity**: 🟢 Nit
- **Affected Scope**: Line 99 ("Tech Stack - Packaging")
- **Simplicity Rationale**:
  The document claims packaging support for "Portable Windows IIS / Apache web server". The repository only provides Docker container orchestration (`Dockerfile`, `docker-compose.yml`) and standard Laravel Artisan/Vite tooling; no IIS `web.config` or Apache vhost configurations are maintained. Speculative deployment claims should be removed to keep documentation grounded in actual infrastructure.

---

## 2. Findings by Inventive Catalyst (`egm-inventive-catalyst`)

### Finding 2.1: Synchronous Database Seeding in Domain Read Path
- **Severity**: 🟡 Major
- **Affected Scope**: Line 63 (`README.md#L63`)
- **False Compromise**:
  The architecture compromises read-query idempotency, concurrency safety, and transaction isolation to achieve out-of-the-box readiness without an explicit setup step. Embedding `DatabaseSeeder::run()` inside `ProjectService::getActiveProject()` executes heavy DDL/DML write transactions during a standard HTTP GET request. In concurrent scenarios, this introduces race conditions, duplicate record insertions, or fatal `database is locked` SQLite errors.
- **Inventive Resolution (TRIZ)**:
  Apply **Preliminary Action (Pattern 3)** / **Extraction (Pattern 2)**. Decouple database population from request-time domain logic. Pre-seed the database during container or environment initialization (`docker/entrypoint.sh` via `SEED_DATABASE=true` or an initial installation script).
- **Secondary Liabilities**:
  Requires environment orchestrators or deployment scripts to manage the initialization step before serving web traffic.

### Finding 2.2: Relational FK Cascade vs. Physical Storage Lifecycle
- **Severity**: 🟡 Major
- **Affected Scope**: Lines 61 and 71 (`README.md#L61, L71`)
- **False Compromise**:
  The design relies on database-level `cascadeOnDelete` across sub-entities (including `attachments`) for operational simplicity, but accepts physical storage leaks as an unhandled consequence. Database-level cascading deletion bypasses application model lifecycle hooks (`deleting`/`deleted` events). When a parent project is purged via SQL cascade, disk files stored in `storage/app/private/attachments` are permanently orphaned on disk.
- **Inventive Resolution (TRIZ)**:
  Apply **Self-Service (Pattern 9)** / **Blessing in Disguise (Pattern 7)**. Introduce an autonomous storage reconciliation mechanism (`artisan storage:reconcile-attachments`) that scans for and purges unreferenced disk files, or dispatch an explicit domain deletion event via an intermediary before cascade execution.
- **Secondary Liabilities**:
  Introduces an additional scheduled maintenance background process or event dispatching overhead during project deletion.
