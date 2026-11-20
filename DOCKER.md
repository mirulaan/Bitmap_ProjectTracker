# Docker Deployment Guide for Bitmap_ProjectTracker

This project is fully containerized and production-ready for deployment on any Docker-compatible infrastructure, including Docker Compose, VPS (Coolify, CapRover, Portainer), Kubernetes, AWS ECS, Google Cloud Run, DigitalOcean App Platform, Fly.io, and Railway.

---

## Architecture Overview

The container setup uses a high-performance **multi-stage build**:
1. **Frontend Builder (`node:22-alpine`)**: Builds Tailwind CSS and JavaScript production bundles via Vite.
2. **Composer Builder (`composer:2`)**: Installs production PHP dependencies with optimized autoloader.
3. **Production Runtime (`php:8.4-fpm-alpine`)**:
   - High-performance Alpine-based PHP 8.4 runtime with OPcache and JIT enabled.
   - Built-in **Nginx** reverse proxy to serve static assets and terminate HTTP traffic directly.
   - **Supervisord** managing both PHP-FPM and Nginx within a single container.
   - Built-in health check using Laravel 13's `/up` endpoint.
   - Dynamic port support (`$PORT`) for Cloud Run, Heroku, and Railway.

---

## 1. Quick Start with Docker Compose

The easiest way to run the stack (Laravel application connected to PostgreSQL, Redis, Queue Worker, and Scheduler) is with Docker Compose:

### Step 1: Prepare Environment File
Copy the Docker-specific environment template:
```bash
cp .env.docker.example .env
```

### Step 2: Generate Application Encryption Key
If you don't already have an `APP_KEY`, generate one:
```bash
# On host (if PHP is installed)
php artisan key:generate --show

# Or generate a base64 32-byte key
openssl rand -base64 32
```
Paste this key into `APP_KEY` in your `.env` file (prefixed with `base64:`).

### Step 3: Build and Start Containers
```bash
docker compose up -d --build
```

The application will be available at:
👉 **[http://localhost:8088](http://localhost:8088)**

Healthcheck endpoint:
👉 **[http://localhost:8088/up](http://localhost:8088/up)**

---

## 2. Docker Compose Services

The `docker-compose.yml` file configures the core services connecting to your PostgreSQL database (`192.168.100.4:5432`):

| Service | Container Name | Description | Port |
| :--- | :--- | :--- | :--- |
| `app` | `bitmap_project_tracker_app` | Web application (Nginx + PHP-FPM + Supervisor) | `8088:80` |
| `redis` | `bitmap_project_tracker_redis` | Redis 7 in-memory cache, session, and queue driver | `6379:6379` |
| `queue` | `bitmap_project_tracker_queue` | Laravel background queue worker (`artisan queue:work`) | Internal |
| `scheduler` | `bitmap_project_tracker_scheduler` | Laravel task scheduler (`artisan schedule:work`) | Internal |

---

## 3. Database Operations & Artisan Commands

Run Artisan commands inside the running `app` container:

### Run Migrations
```bash
docker compose exec app php artisan migrate --force
```

### Run Database Seeders
```bash
docker compose exec app php artisan db:seed --force
```

### Access Laravel Tinker
```bash
docker compose exec app php artisan tinker
```

### Clear / Refresh Caches
```bash
docker compose exec app php artisan optimize:clear
docker compose exec app php artisan optimize
```
