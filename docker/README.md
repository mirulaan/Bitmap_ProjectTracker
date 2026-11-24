# Docker Infrastructure Package Contract

## Overview
The `docker/` directory contains container orchestration, runtime bootstrapping, and process supervision configurations for the **Bitmap Project Tracker** production and staging environments. It provisions a consolidated deployment pattern combining PHP 8.4-FPM, Nginx, and Supervisord on Alpine Linux, coordinated via an initialization entrypoint.

## Interface
- Container Entrypoint: `/usr/local/bin/entrypoint.sh` (sourced from [docker/entrypoint.sh](file:///Users/macbookpro/Documents/macbookpro/VibeCode/Bitmap_ProjectTracker/docker/entrypoint.sh))
- Process Supervisor: `supervisord -c /etc/supervisor/conf.d/supervisord.conf`
- Exposed Ports: Port 80 (HTTP default) or dynamic port configured via `$PORT`.
- Environment Variables Contract:
  - `PORT`: Dynamic HTTP listen port (patches Nginx listen directive).
  - `APP_ENV`: Application environment (`production` enables caching).
  - `APP_KEY`: Laravel encryption key (auto-generates if empty).
  - `DB_CONNECTION`: Database driver (`sqlite`, `pgsql`, `mysql`).
  - `RUN_MIGRATIONS`: Automated migration execution trigger (`true`/`false`).
  - `SEED_DATABASE`: Automated database seeder trigger (`true`/`false`).
  - `SKIP_OPTIMIZATION`: Bypasses route/config/view cache generation.

## Invariants
- Storage directory existence and permissions (`chown -R www-data:www-data`, `chmod -R 775`).
- Automatic public storage symlink creation (`php artisan storage:link`).
- SQLite initialization ensures `database/database.sqlite` exists with `0664` file permissions owned by `www-data:www-data`.
- Dual-process supervision guarantees PHP-FPM is operational before Nginx begins serving requests.

## Side Effects
- Modifies Nginx configuration dynamically on boot based on `$PORT`.
- Initializes filesystem permissions on `/var/www/html/storage` and `/var/www/html/bootstrap/cache`.
- Executes automated database migrations and cache optimizations when triggered.

## Verification
- Run: `docker build -t bitmap-project-tracker:test -f Dockerfile .`
