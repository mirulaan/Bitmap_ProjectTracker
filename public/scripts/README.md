# Telemetry Automation Scripts Package Contract

## Overview
The `public/scripts` component hosts operational deployment scripts and self-extracting agent packages used by plant floor automation terminals and vision test benches to report real-time hardware telemetry into **Bitmap Project Tracker**.

## Interface
- PowerShell Automation Scripts:
  - `Bootstrap-NGCAgent.ps1`: Zero-touch bootstrap and migration script that elevates to Administrator/SYSTEM, sets up `C:\Hardware\NGCTelemetryAgent`, migrates legacy Task Scheduler jobs, and installs unified agent services.
  - `Push-Telemetry.ps1`: Harvests local IP subnet (e.g. `172.16.x.x`), parses HWiNFO64 CSV logs and sensor data, and pushes JSON metrics to target server endpoint (`/api/ping` or telemetry listeners).
- Binary Agent Artifacts:
  - `NGCTelemetryAgent.exe` & `NGCTelemetryAgent.zip`: Standalone Windows background worker service.
  - `HWiNFO64.zip`: Portable hardware diagnostic sensor utility bundle.
- Redirection Guard:
  - `index.php`: Enforces silent HTTP redirection (`header("Location: /")`) to prevent directory listing exposure.

## Invariants
- PowerShell scripts require Windows Administrator privileges and auto-elevate via `Start-Process powershell -Verb RunAs`.
- Local IP auto-discovery filters out broadcast addresses and camera/isolated NIC networks.
- Scripts operate reliably on air-gapped or isolated industrial subnets without external internet access.

## Side Effects
- Installs scheduled tasks on target client Windows PCs (`NGCTelemetryAgent`).
- Writes local diagnostics logs to `C:\Hardware\NGCTelemetryAgent\bootstrap.log`.
- Sends HTTP POST telemetry packets across the internal network.

## Verification
- Run: `powershell -Command "Test-Path public/scripts/Bootstrap-NGCAgent.ps1"`
