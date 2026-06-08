# Market Data Command Center

A dependency-free Node and browser dashboard that demonstrates financial frontend/backend behavior from the frontend, MERN, Go, Java, and QA resume tracks.

It simulates market ticks, streams them to the browser over server-sent events, renders a live price chart, exposes order-book depth, and calculates portfolio P&L and risk metrics with deterministic tests.

## Enterprise Behaviors Demonstrated

- Real-time event stream using built-in Node HTTP APIs.
- Deterministic market simulator for repeatable tests and demos.
- Portfolio mark-to-market calculations with realized and unrealized P&L.
- Order-book depth modeling with sorted bid/ask levels and spread calculation.
- Risk snapshot with gross exposure, net exposure, concentration, and simple VaR estimate.
- Browser dashboard with live charting, portfolio table, order book, risk metrics, and event log.
- Node built-in test suite for financial calculation behavior.

## Run

```powershell
npm start
```

Open:

```text
http://localhost:5177
```

## Test

```powershell
npm test
```

## Resume Mapping

This project supports bullets around:

- Real-time trading dashboards and WebSocket/SSE-style feeds.
- Financial data rendering and P&L correctness.
- High-volume market event simulation.
- Frontend performance-minded state updates.
- Backend API design for portfolio and order-book data.
- QA automation around deterministic financial calculations.

## Production Next Steps

- Replace the simulator with Kafka, NATS, or exchange gateway feeds.
- Add authenticated user portfolios and persisted trade history.
- Add WebSocket transport when bidirectional order entry is needed.
- Add Playwright visual checks for chart and table regressions.
- Add OpenTelemetry spans and browser performance metrics.
