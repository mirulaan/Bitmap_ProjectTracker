# Client JavaScript Libraries Package Contract

## Overview
The `public/js` directory contains standalone, self-hosted frontend JavaScript libraries providing data visualization, Gantt rendering, trendline analysis, and Tailwind CSS runtime styling without external CDN dependencies.

## Interface
- Bundled Client Libraries:
  - `chart.js`: Complete Chart.js charting engine for dashboard progress metrics and status breakdown donuts.
  - `chartjs-plugin-trendline.js`: Trendline regression plugin calculating trajectory lines on time-series charts.
  - `tailwindcss.js`: Standalone client Tailwind CSS engine providing styling fallbacks on air-gapped systems.

## Invariants
- Zero external CDN dependencies: all assets resolve locally from the web server document root.
- Compatible with offline and air-gapped industrial workstations.

## Side Effects
- Injects global client runtime objects (`window.Chart`, `window.tailwind`) into the browser DOM.

## Verification
- Inspect: Loaded via `<script src="/js/chart.js">` in `resources/views/layouts/app.blade.php`.
