# Portainer Deployment Guide for Bitmap Project Tracker

This guide walks through deploying **Bitmap Project Tracker** using **Portainer** (Community or Business Edition) with the repository's existing [`docker-compose.yml`](./docker-compose.yml) and [`Dockerfile`](./Dockerfile).

---

## Prerequisites

- A running **Docker** host managed by **Portainer** (2.19+ recommended for Docker Compose v2 support).
- **PostgreSQL** server reachable from the Docker host (the default `docker-compose.yml` expects an external PostgreSQL instance, e.g., `192.168.100.4:5432`).
- Network access from the Portainer host to GitHub (if deploying via Git) or a pre-built `bitmap-project-tracker:latest` image on the host/registry.
- Ports available on the host:
  - `8628` (default `APP_PORT` for the web UI & `/api/ping` telemetry endpoint)
  - `6379` (default `FORWARD_REDIS_PORT`, configurable if port `6379` is already in use on the host)

---

## Stack Architecture

Deploying [`docker-compose.yml`](./docker-compose.yml) creates 4 containers on a shared bridge network (`bitmap_network`):

| Service | Container Name | Role | Persistent Volume |
| :--- | :--- | :--- | :--- |
| `app` | `bitmap_project_tracker_app` | Nginx + PHP 8.4-FPM + Supervisord | `app_storage` (`/var/www/html/storage`) |
| `queue` | `bitmap_project_tracker_queue` | Laravel queue worker (`artisan queue:work`) | `app_storage` (`/var/www/html/storage`) |
| `scheduler` | `bitmap_project_tracker_scheduler` | Laravel scheduler (`artisan schedule:work`) | `app_storage` (`/var/www/html/storage`) |
| `redis` | `bitmap_project_tracker_redis` | Redis 7 (cache, sessions, queues) | `redis_data` (`/data`) |

---

## Step 1: Generate an `APP_KEY`

All three Laravel containers (`app`, `queue`, and `scheduler`) **must share the exact same `APP_KEY`**. Generate one before creating the stack:

```bash
# Option A: Using PHP/Artisan locally
php artisan key:generate --show

# Option B: Using OpenSSL on Linux/macOS/Git Bash
echo "base64:$(openssl rand -base64 32)"
```

Keep this `base64:...` value ready for Step 3.

---

## Step 2: Create the Stack in Portainer

1. Log in to your **Portainer** dashboard.
2. Select your target **Environment** (e.g., `local`).
3. In the left sidebar, click **Stacks** → **+ Add stack**.
4. Enter a **Name** for the stack, e.g. `bitmap-project-tracker`.
5. Choose one of the deployment methods below:

### Method A: Deploy from Git Repository (Recommended)

Portainer will clone the repository and build the `bitmap-project-tracker:latest` image automatically using the [`Dockerfile`](./Dockerfile).

1. Under **Build method**, select **Repository**.
2. Configure the repository settings:
   - **Repository URL**: `https://github.com/mirulaan/Bitmap_ProjectTracker.git`
   - **Repository reference**: `refs/heads/main` (or your target branch)
   - **Compose path**: `docker-compose.yml`
   - *(Optional)* Enable **Automatic updates** (GitOps polling or webhook) if you want Portainer to redeploy on new commits.
3. *(If the repository is private)* Enable **Authentication** and enter your Git username and Personal Access Token (PAT).

### Method B: Deploy via Web Editor (Pre-built Image)

Use this method if your Docker host is air-gapped or you prefer building the image manually.

1. First, build the image on the Docker host (or pull it from your private registry):
   ```bash
   git clone https://github.com/mirulaan/Bitmap_ProjectTracker.git
   cd Bitmap_ProjectTracker
   docker build -t bitmap-project-tracker:latest .
   ```
2. In Portainer, under **Build method**, select **Web editor**.
3. Paste the contents of [`docker-compose.yml`](./docker-compose.yml) into the editor.
4. Remove the `build:` block under `app:` (lines 3–5) so Compose uses the pre-built `bitmap-project-tracker:latest` image directly instead of looking for a local `Dockerfile`.

---

## Step 3: Configure Environment Variables

In the Portainer stack page, scroll down to **Environment variables** and add the required variables (you can also click **Load variables from .env file** using [`.env.docker.example`](./.env.docker.example) as a template).

### Required / Recommended Variables

| Variable | Example / Default | Notes |
| :--- | :--- | :--- |
| `APP_KEY` | `base64:YOUR_GENERATED_KEY` | **Required.** Must be identical across `app`, `queue`, and `scheduler`. |
| `APP_URL` | `http://<SERVER_IP>:8628` | Public URL or IP used to access the app. |
| `APP_PORT` | `8628` | Host port mapped to container port `80`. |
| `APP_ENV` | `production` | Enables Laravel config/route/view/event caching in [`docker/entrypoint.sh`](./docker/entrypoint.sh). |
| `APP_DEBUG` | `false` | Keep `false` in production. |
| `DB_CONNECTION` | `pgsql` | Database driver (`pgsql` recommended). |
| `DB_HOST` | `192.168.100.4` | Hostname or IP of your PostgreSQL server. |
| `DB_PORT` | `5432` | PostgreSQL port. |
| `DB_DATABASE` | `Bitmap_ProjectTracker` | Target PostgreSQL database name (must already exist). |
| `DB_USERNAME` | `postgres` | PostgreSQL username. |
| `DB_PASSWORD` | `your-secure-password` | PostgreSQL password. |
| `RUN_MIGRATIONS` | `true` | Runs `php artisan migrate --force` automatically on `app` startup. |
| `SEED_DATABASE` | `false` | Set `true` only if you want `db:seed` to run on startup. |
| `FORWARD_REDIS_PORT` | `6379` | Change if port `6379` is already bound on the Docker host. |

> [!NOTE]
> Make sure the target PostgreSQL database (`DB_DATABASE`) already exists and accepts connections from the Docker host IP (`pg_hba.conf` and `listen_addresses`).

---

## Step 4: Deploy the Stack

1. Scroll to the bottom of the Portainer stack page and click **Deploy the stack**.
2. Portainer will build the image (if using Method A), pull `redis:7-alpine`, create `bitmap_network`, `app_storage`, and `redis_data`, and start all 4 containers.
3. Wait for `bitmap_project_tracker_app` and `bitmap_project_tracker_redis` to report **healthy** in Portainer's **Containers** view.

---

## Step 5: Verify the Deployment

1. **Healthcheck endpoint**: Open `http://<SERVER_IP>:8628/up` — you should see a `200 OK` response from Laravel.
2. **Application UI**: Open `http://<SERVER_IP>:8628` in your browser.
3. **Container Logs**: In Portainer, open **Containers** → `bitmap_project_tracker_app` → **Logs** to confirm migrations and Laravel cache optimization succeeded without database connection errors.

---

## Common Operations in Portainer

### Running Artisan Commands

1. Go to **Containers** → `bitmap_project_tracker_app` → **Console**.
2. Select `/bin/sh` and click **Connect**.
3. Run commands as needed:
   ```sh
   # Check migration status
   php artisan migrate:status

   # Clear and rebuild Laravel caches
   php artisan optimize:clear
   php artisan optimize

   # Run database seeders manually
   php artisan db:seed --force
   ```

### Updating the Application

- **Git Stack (Method A)**: Open the stack in Portainer → click **Pull and redeploy** (enable **Re-pull image and redeploy** if needed).
- **Web Editor Stack (Method B)**: Rebuild `bitmap-project-tracker:latest` on the Docker host, then in Portainer open the stack and click **Update the stack**.

---

## Troubleshooting

- **Database connection refused / timeout**:
  - Verify `DB_HOST` is reachable from inside the container (not `localhost` or `127.0.0.1`, which refers to the container itself).
  - Confirm PostgreSQL `listen_addresses` and `pg_hba.conf` allow connections from the Docker bridge subnet.
- **Port `6379` already in use**:
  - Set `FORWARD_REDIS_PORT=6380` (or any free port) in the stack's Environment Variables, since internal containers communicate with Redis over `redis:6379` on `bitmap_network`.
- **500 Error / Session or Encryption Mismatch**:
  - Confirm `APP_KEY` is explicitly set in Portainer's Environment Variables and not left blank. If left blank, each container generates an ephemeral key on boot, causing mismatches between `app`, `queue`, and `scheduler`.
- **Reverse Proxy / HTTPS**:
  - If placing Nginx Proxy Manager, Traefik, or Caddy in front of Portainer, forward traffic to `<DOCKER_HOST_IP>:8628` (or attach the `app` container to your proxy's Docker network on port `80`) and set `APP_URL=https://your-domain.com`.
