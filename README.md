# Market Data Command Center

A real-time market data dashboard that streams simulated ticks, renders price movement, calculates portfolio P&L, builds order-book depth, and exposes risk snapshots.

## Stack

Node.js, browser dashboard, real-time market data

## Problem

Trading interfaces need live data handling, deterministic financial calculations, and low-friction operational visibility.

## Architecture

- server.mjs serves static assets, API endpoints, and server-sent events.
- market-simulator.mjs produces deterministic tick streams for testability.
- Browser assets render chart, portfolio, order book, and risk panels.

## Implemented Production Readiness

- CI runs the market-data test suite.
- Simulation accepts injectable time for deterministic tests.
- The API separates portfolio, order-book, and stream concerns.

## Run And Test

```powershell
npm test
npm start
Open http://localhost:5177
```

## Quality Gates

- Project-specific GitHub Actions workflow included under .github/workflows/ci.yml.
- Generated build outputs and dependency folders are excluded through .gitignore.
- Tests and validation commands are intentionally small enough to run during code review.

## Production Extension Points

- Replace simulator with Kafka or exchange gateway feeds.
- Add authenticated portfolios.
- Add OpenTelemetry spans and browser performance metrics.

## Repository Hygiene

This repository contains original portfolio code only. It does not include employer source code, private resumes, generated binaries, local credentials, or large media files.

