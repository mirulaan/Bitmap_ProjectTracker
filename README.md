# Bitmap_ProjectTracker

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3%2B-777BB4?logo=php&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)

**Bitmap_ProjectTracker** is a production-grade industrial automation and hardware deployment project tracking application. Built with high performance, resilience, and offline-first capabilities in mind, it provides full lifecycle management across hardware procurement, panel assembly, PLC/vision software engineering, factory acceptance testing (FAT), and onsite commissioning.

---

## Key Features

- **Executive & Engineering Dashboard**: Real-time project progress, phase milestones, priority task distribution, recent attachments, and activity history.
- **Hierarchical Task Tree**: Structured task management categorized by phases, subtasks, checklists, priorities, and assigned engineers.
- **Interactive Gantt Timeline**: Visual schedule tracking with dependencies, milestone markers, critical path highlighting, and dynamic date adjustments.
- **Export & Reports Generator**: One-click printable reports formatted for executive summaries, phase delivery breakdowns, critical path analysis, and client status reports.
- **Telemetry & Industrial Forensics Integration**: Built-in support for hardware telemetry scripts, HWiNFO64 monitoring logs, and automation diagnostic packages.
- **Resilient Offline-Ready Architecture**: Self-contained SQLite persistence, self-hosted web fonts, and fallback offline CSS for air-gapped shop-floor workstations.

---

## Tech Stack

- **Backend**: Laravel 13 (PHP 8.3+)
- **Database**: SQLite (WAL mode enabled)
- **Frontend**: Laravel Blade, Tailwind CSS v4, Chart.js, Chart.js Trendline
- **Build System**: Vite 8 & Concurrently
- **Packaging**: Portable Windows IIS / Apache web server support

---

## Getting Started

### Prerequisites

- PHP 8.3 or newer with `pdo_sqlite` and `mbstring` extensions
- Composer
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/mirulaan/Bitmap_ProjectTracker.git
cd Bitmap_ProjectTracker

# Install PHP dependencies
composer install

# Environment setup
cp .env.example .env
php artisan key:generate

# Run database migrations and seeders
php artisan migrate --force
php artisan db:seed

# Install frontend dependencies and build assets
npm install
npm run build
```

### Running Locally

```bash
# Start development servers (Vite + Laravel server)
composer run dev
```

Visit `http://localhost:8000` in your browser.

---

## Testing

```bash
php artisan test
```

---

## Release Notes

### v1.0.0
- Migrated architecture to Laravel 13, SQLite, Blade, Tailwind CSS v4, and Vite.
- Implemented complete task hierarchy, interactive Gantt visualization, and reporting modules.
- Created standalone `VERSION` tracker and synchronized with production air-gapped deployment specs.
