# Realtime Benchmark Runbook

## Prerequisites

- Backend running on `http://localhost:3000`
- Bun installed
- Optional Redis running and `REDIS_URL` configured

## Commands

From repository root:

```bash
bun tools/bench/ws-load.ts --url ws://localhost:3000/ws?room=bench20 --clients 20 --duration 60
bun tools/bench/ws-load.ts --url ws://localhost:3000/ws?room=bench50 --clients 50 --duration 60
bun tools/bench/ws-load.ts --url ws://localhost:3000/ws?room=bench100 --clients 100 --duration 60
```

## Data to capture

- Tool output summary json
- `/api/realtime/metrics` snapshots every 5 seconds during run
- Server logs for heartbeat timeout and input rejection spikes

## Result table template

| Scenario | Clients | Duration | Msg/s | Tick p95 | Input reject % | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| bench20 | 20 | 60s | TBD | TBD | TBD | |
| bench50 | 50 | 60s | TBD | TBD | TBD | |
| bench100 | 100 | 60s | TBD | TBD | TBD | |

## Acceptance targets

- 20 clients: stable snapshots, negligible input rejection
- 50 clients: `tick_ms_p95 <= 20ms`
- 100 clients: service remains responsive without crash, with documented degradation behavior
