# Frontend JavaScript Package Contract

## Overview
The `resources/js` directory contains source JavaScript entrypoints managed by Vite for application build bundling and client module imports.

## Interface
- `resources/js/app.js`: Vite application bundle entrypoint.

## Invariants
- Compiled into production bundles (`public/build`) via `npm run build`.
- Works concurrently with standalone self-hosted libraries in `public/js`.

## Side Effects
- Emits compiled assets into `public/build/assets` during Vite execution.

## Verification
- Run: `npm run build`
