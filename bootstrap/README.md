# Framework Bootstrap Package Contract

## Overview
The `bootstrap/` component initializes the Laravel 13 application kernel, registers core routing maps, defines global middleware stacks, and configures exception handling behavior.

## Interface
- `bootstrap/app.php`:
  - `Application::configure(basePath: dirname(__DIR__))`:
    - `withRouting`: Binds `routes/web.php`, `routes/api.php`, `routes/console.php`, and `/up` health check.
    - `withExceptions`: Enforces JSON formatting for unhandled exceptions under `api/*` request paths.
- `bootstrap/providers.php`:
  - Returns array of active application service providers (`App\Providers\AppServiceProvider::class`).

## Invariants
- Returns fully configured `Illuminate\Foundation\Application` instance.
- Health check endpoint `/up` responds with HTTP 200 without requiring database connectivity or session middleware.

## Side Effects
- Loads configuration, bootstraps logging, and registers service container singletons.

## Verification
- Run: `php artisan --version`
