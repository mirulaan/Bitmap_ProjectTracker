# Blade Layouts Package Contract

## Overview
The `resources/views/layouts` component defines application shell templates, document headers, global navigation bars, flash notification banners, and modal injection slots for **Bitmap Project Tracker**.

## Interface
- `resources/views/layouts/app.blade.php`:
  - Main HTML document skeleton (`<html>`, `<head>`, `<body>`).
  - Navigation header displaying project title, active tab tabs (`dashboard`, `tasks`, `gantt`, `reports`, `setup`), and quick action buttons (Export, Import, Template).
  - Flash notification banner container (`@if(session('success'))`, `@if(session('error'))`).
  - Main content injection slot (`@yield('content')`).
  - Script stack and modal placeholder injection points.

## Invariants
- Enforces responsive, high-contrast dark/light styling using local Tailwind CSS v4 variables.
- Loads self-hosted web fonts (`/css/fonts.css`) and local Chart.js bundle (`/js/chart.js`) for full offline capability.

## Side Effects
- Renders HTML and client DOM scaffolding.

## Verification
- Run: `php artisan test`
