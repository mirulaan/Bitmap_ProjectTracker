# Consolidated EGM Review Report

**Target Document**: [/Users/macbookpro/Documents/macbookpro/VibeCode/Bitmap_ProjectTracker/README.md](file:///Users/macbookpro/Documents/macbookpro/VibeCode/Bitmap_ProjectTracker/README.md)  
**Execution Mode**: Consolidated Full Review (Stages 5–9)  
**Date**: 2026-11-22  
**Participating Personas**: `egm-zoom-out`, `egm-inventive-catalyst`, `egm-comprehension`, `egm-design`, `egm-structural`, `egm-style`, `egm-implementation-readiness`

---

## Executive Summary

The Goldfish Review Protocol completed a comprehensive five-stage audit of the root repository blueprint and feature specification for **Bitmap Project Tracker**. The architecture succeeds in defining an offline-resilient, modular application structure (Laravel 13, Blade, Tailwind CSS v4, local SQLite/PostgreSQL persistence). 

However, the review identified critical discrepancies against EGM quality standards:
1. **Speculative Telemetry Pipeline**: The Mermaid diagram and narrative describe an end-to-end telemetry ingestion pipeline routing `POST /api/ping` into domain models and database tables that do not exist in the codebase.
2. **Missing Standard Sections**: The document lacks mandatory sections required by the Feature Specification Standard (`## Alternatives Considered`, `## Risks & Mitigations`, `## Problem Statement`, and `## Goals & Non-Goals`).
3. **Database Seeding Anti-Pattern**: Embedding database seeding inside the domain read accessor `ProjectService::getActiveProject()` introduces severe race conditions and transaction locks under concurrent requests.
4. **Getting Started Friction**: Defaulting to PostgreSQL in `.env.example` without listing it in Prerequisites causes immediate migration failures on fresh checkouts.

---

## Consolidated Action Items by Priority

### 🔴 Blockers (Immediate Remediation Required)

1. **Eliminate Speculative Telemetry Architecture from Diagram and Text**
   - *Issue*: The Mermaid architecture diagram (lines 18–28), side effects (lines 72–73), and key features (line 88) claim telemetry stations POST into Controllers, `ProjectService`, Models, and the Database. In reality, `routes/api.php` only exposes a lightweight `GET /ping` closure returning `{"status": "ok"}` with zero database persistence.
   - *Action*: Correct the Mermaid diagram and documentation to reflect the actual architecture (a heartbeat ping endpoint) or formally document the planned ingestion schema if telemetry persistence is being introduced.

2. **Add Mandatory "Alternatives Considered" Section**
   - *Issue*: Violates the Alternatives Rule in `feature-spec-standard.md`. No alternatives or trade-offs are documented for major architectural choices.
   - *Action*: Add `## Alternatives Considered` documenting rejected alternatives:
     - Server-rendered Blade + Tailwind CSS vs. Client-side SPA / Inertia.js (chosen for offline simplicity, zero build runtime overhead on low-spec shop-floor machines).
     - Relational SQLite/PostgreSQL vs. Dedicated Time-Series DB (chosen for zero-ops offline portability).
     - Lightweight HTTP ping vs. Heavyweight MQTT / OPC-UA broker (chosen to avoid daemon maintenance on air-gapped stations).

3. **Add Mandatory "Risks & Mitigations" Section**
   - *Issue*: Violates `feature-spec-standard.md`. Fails to document operational failure modes, concurrency bounds, and security boundaries.
   - *Action*: Add `## Risks & Mitigations` covering:
     - SQLite single-writer lock contention (`SQLITE_BUSY`) mitigated by enabling WAL mode and bounded retry delays.
     - Telemetry endpoint security and unauthenticated traffic mitigation.
     - Air-gapped terminal state synchronization and offline conflict management.

---

### 🟡 Major Findings (Architectural & Structural Remediation)

4. **Add "Problem Statement" and "Goals & Non-Goals"**
   - *Action*: Structure the opening sections to define the specific operational gaps in industrial automation lifecycle tracking, and explicitly define Non-Goals (e.g., Non-Goal: Real-time closed-loop PLC machine control or SCADA supervisory actuation).

5. **Decouple Database Seeding from Domain Read Queries**
   - *Issue*: `ProjectService::getActiveProject()` automatically executes `DatabaseSeeder::run()` when zero projects exist (line 63). This causes write race conditions, deadlocks, and latency spikes during concurrent GET requests.
   - *Action*: Remove automatic seeding from request-time domain logic. Require explicit seeding during container boot (`docker/entrypoint.sh` via `SEED_DATABASE=true`) or manual setup (`php artisan db:seed`). Handle unseeded states in the UI with a clean empty-state view.

6. **Resolve Physical Storage Leak from Relational Foreign Key Cascades**
   - *Issue*: `cascadeOnDelete` in database migrations bypasses Eloquent model events. Deleting a project leaves orphaned attachment files permanently on disk under `storage/app/private/attachments`.
   - *Action*: Introduce an automated storage reconciliation command (`php artisan storage:reconcile-attachments`) or use model event listeners prior to cascade execution to safely unlink disk assets.

7. **Fix Getting Started Database Configuration Ambiguity**
   - *Issue*: `php artisan migrate --force` fails on clean checkouts because `.env.example` defaults to PostgreSQL on `127.0.0.1:5432` without PostgreSQL being listed under Prerequisites.
   - *Action*: Update `## Getting Started` to provide clear, dual-path instructions for SQLite (zero-config local default: `touch database/database.sqlite` and `DB_CONNECTION=sqlite`) versus PostgreSQL.

8. **Calibrate Promotional Copy, Jargon, and Uncalibrated Claims**
   - *Action*: Apply copy-editing revisions:
     - Line 10: Replace "production-grade" and "Built with high performance, resilience..." with direct scope description.
     - Line 16: Replace "cleanly separates", "zero-config SQLite", and "offline-resilient operations workspace".
     - Line 60: Replace absolute guarantee ("to guarantee full functionality...") with technical capability ("to operate on air-gapped industrial plant networks...").
     - Lines 84–89: Remove "Real-time" (not streaming), "Structured" (filler), "One-click" (promotional), and "Industrial Forensics" (inflated jargon).

---

### 🟢 Nits (Quality & Consistency Polish)

9. **Consolidate Duplicate Verification Sections**
   - *Action*: Merge `## System Verification` (lines 76–79) and `## Testing` (lines 145–149) into a single unified verification section.

10. **Include `VERSION` in Local Interface Manifest**
    - *Action*: Add `VERSION` tracking file to `## Local Interface & Invariants` (lines 34–42).

11. **Prune Phantom Configuration References**
    - *Action*: Remove or clarify `config/telemetry.php` boundary references to unrouted services (`PlantService::syncConfig()`).

12. **Remove Speculative Packaging Claims**
    - *Action*: Remove "Portable Windows IIS / Apache web server" from Tech Stack packaging; specify Docker Compose, Nginx, and standard PHP-FPM deployment.

---

## Traceability Matrix

| Finding ID | Stage & Reviewer | Severity | Target Scope | Consolidated Action Item |
| :--- | :--- | :--- | :--- | :--- |
| **ZO-1** | Stage 5 (`egm-zoom-out`) | 🔴 Blocker | Lines 16, 18–28, 72–73, 88 | Item 1: Eliminate Speculative Telemetry Pipeline |
| **IC-1** | Stage 5 (`egm-inventive-catalyst`) | 🟡 Major | Line 63 | Item 5: Decouple Database Seeding from Read Queries |
| **IC-2** | Stage 5 (`egm-inventive-catalyst`) | 🟡 Major | Lines 61, 71 | Item 6: Resolve Physical Storage Leaks from FK Cascades |
| **ZO-2** | Stage 5 (`egm-zoom-out`) | 🟡 Major | Line 63 | Item 5: Decouple Database Seeding from Read Queries |
| **ZO-3** | Stage 5 (`egm-zoom-out`) | 🟢 Nit | Line 49 | Item 11: Prune Phantom Configuration References |
| **ZO-4** | Stage 5 (`egm-zoom-out`) | 🟢 Nit | Line 99 | Item 12: Remove Speculative Packaging Claims |
| **CO-1** | Stage 6 (`egm-comprehension`) | 🟡 Major | Lines 105–132 | Item 7: Fix Getting Started Database Setup Ambiguity |
| **CO-2** | Stage 6 (`egm-comprehension`) | 🟢 Nit | Lines 32–42, 158 | Item 10: Include `VERSION` in Local Interface Manifest |
| **DC-1** | Stage 7 (`egm-design`) | 🔴 Blocker | Document-wide | Item 2: Add Mandatory "Alternatives Considered" Section |
| **DC-2** | Stage 7 (`egm-design`) | 🔴 Blocker | Document-wide | Item 3: Add Mandatory "Risks & Mitigations" Section |
| **DC-3** | Stage 7 (`egm-design`) | 🟡 Major | Lines 10–11, 82–90 | Item 4: Add "Problem Statement" and "Goals & Non-Goals" |
| **DC-4** | Stage 7 (`egm-design`) | 🟡 Major | Line 63 | Item 5: Decouple Database Seeding from Read Queries |
| **DC-5** | Stage 7 (`egm-design`) | 🟡 Major | Lines 20–28, 60, 70 | Item 3: Concurrency & Lock Management in Risks |
| **DC-6** | Stage 7 (`egm-design`) | 🟡 Major | Lines 21, 71–73 | Item 3: Telemetry Security & Rate Limiting in Risks |
| **ST-1** | Stage 7 (`egm-structural`) | 🔴 Blocker | Document-wide | Item 2: Add Mandatory "Alternatives Considered" Section |
| **ST-2** | Stage 7 (`egm-structural`) | 🔴 Blocker | Document-wide | Item 3: Add Mandatory "Risks & Mitigations" Section |
| **ST-3** | Stage 7 (`egm-structural`) | 🟡 Major | Lines 10–12, 82–90 | Item 4: Add "Problem Statement" and "Goals & Non-Goals" |
| **ST-4** | Stage 7 (`egm-structural`) | 🟢 Nit | Lines 76–79, 145–149 | Item 9: Consolidate Duplicate Verification Sections |
| **SY-1** | Stage 7 (`egm-style`) | 🟡 Major | Line 10 | Item 8: Calibrate Promotional Copy and Fluff |
| **SY-2** | Stage 7 (`egm-style`) | 🟡 Major | Line 16 | Item 8: Remove Subjective Quality Judgments |
| **SY-3** | Stage 7 (`egm-style`) | 🟡 Major | Line 60 | Item 8: Calibrate Absolute Guarantees |
| **SY-4** | Stage 7 (`egm-style`) | 🟡 Major | Lines 84–89 | Item 8: Calibrate Inflated Claims & Jargon |
| **SY-5** | Stage 7 (`egm-style`) | 🟢 Nit | Line 99 | Item 12: Remove Speculative Packaging Claims |
| **SY-6** | Stage 7 (`egm-style`) | 🟢 Nit | Lines 157–158 | Item 8: Simplify Release Notes Intensifiers |
| **IR-1** | Stage 9 (`egm-implementation`) | 🟡 Major | Lines 105–132 | Item 7: Fix Getting Started Database Setup Ambiguity |
| **IR-2** | Stage 9 (`egm-implementation`) | 🟡 Major | Lines 21, 72–73 | Item 1: Harmonize Telemetry Script URLs with Routes |
