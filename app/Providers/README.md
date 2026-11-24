# Application Providers Package Contract

## Overview
The `app/Providers` component encapsulates framework bootstrapping configurations and service container bindings for **Bitmap Project Tracker**.

## Interface
- `App\Providers\AppServiceProvider`:
  - `register(): void`: Registers application bindings into the Laravel service container.
  - `boot(): void`: Configures runtime application policies, date localization, and model behavior.

## Invariants
- Preserves Laravel 13 single-provider registration convention referenced in `bootstrap/providers.php`.
- Boot logic executes on every incoming HTTP and console lifecycle execution.

## Side Effects
- Binds services and listeners into `Illuminate\Foundation\Application`.

## Verification
- Run: `php artisan test`
