# Application Configuration Package Contract

## Overview
The `config/` directory defines environmental parameters, infrastructure credentials, telemetry mappings, and runtime driver bindings for **Bitmap Project Tracker**.

## Interface
- Configuration Files:
  - `app.php`: Application name, environment (`APP_ENV`), debug mode, URL, and timezone settings.
  - `auth.php`: Authentication guards and user provider configurations.
  - `cache.php`: Cache stores (`database`, `file`, `redis`, `array`).
  - `database.php`: Connection profiles for SQLite (`sqlite`) and PostgreSQL (`pgsql`).
  - `filesystems.php`: Local disk (`storage/app/private`), public disk (`storage/app/public`), and SFTP configurations.
  - `logging.php`: Logging channels (`single`, `daily`, `stderr`).
  - `mail.php`: Mail transport options.
  - `queue.php`: Queue connections (`sync`, `database`).
  - `sanctum.php`: API token authentication guard settings.
  - `services.php`: Third-party service credentials.
  - `session.php`: HTTP session storage driver and cookie security attributes.
  - `telemetry.php`: Industrial telemetry settings, plant mappings (Plant 7: Lines 73-78, Plant 8: Lines 83-92 & 105, Plant 9: Lines 93-104), and auto-detection parameters.

## Invariants
- Environment variables configured via `.env` override default configuration arrays.
- Database default driver defaults to `sqlite` for offline-first resilience if `DB_CONNECTION` is unset.
- Telemetry plant selection auto-resolves when configured as `auto`.

## Side Effects
- Dictates runtime behavior of all Laravel subsystems.
- Evaluated and cached into `bootstrap/cache/config.php` during production optimization (`php artisan config:cache`).

## Verification
- Run: `php artisan config:show app`
