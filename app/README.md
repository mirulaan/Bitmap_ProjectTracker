# Application Subsystem Blueprint

## Overview
The `app/` directory houses the primary backend application code for **Bitmap Project Tracker**. It is organized into clean architectural layers covering HTTP handling, domain models, service orchestration, and framework bootstrap providers.

## Subdirectories & Boundaries
- Http: [./Http/README.md](./Http/README.md) - HTTP transport layer including controller endpoints and response rendering.
- Models: [./Models/README.md](./Models/README.md) - Eloquent ORM entity definitions and relational graph mappings.
- Providers: [./Providers/README.md](./Providers/README.md) - Application bootstrapping and service container configuration providers.
- Services: [./Services/README.md](./Services/README.md) - Core business logic, project calculation engines, and JSON serialization.
