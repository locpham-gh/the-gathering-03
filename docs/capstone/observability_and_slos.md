# Realtime Observability and SLOs

## Metrics endpoint

- URL: `GET /api/realtime/metrics`
- Source: `apps/server/src/realtime/metrics.ts`

## Exposed counters

- `ws_connections_opened`
- `ws_connections_closed`
- `ws_messages_received`
- `ws_messages_sent`
- `ws_input_rejected`
- `ws_input_applied`
- `ws_heartbeat_timeouts`
- `ws_snapshot_broadcasts`

## Exposed gauges

- `rooms_active`
- `players_active`

## Exposed timings

- `tick_ms_p50`
- `tick_ms_p95`

## Suggested SLOs for capstone

- Availability SLO: realtime gateway responds and broadcasts snapshots > 99.5%.
- Performance SLO: `tick_ms_p95 <= 20ms` under 50 concurrent users.
- Correctness SLO: `ws_input_rejected / ws_messages_received < 2%` in normal conditions.
- Liveness SLO: false heartbeat timeout rate < 1% per 30-minute session.

## Dashboard views

- **System health**
  - rooms active
  - players active
  - open vs closed connections
- **Realtime quality**
  - tick p50/p95 over time
  - snapshots per second
  - input applied vs rejected
- **Resilience**
  - heartbeat timeout spikes
  - reconnect behavior correlation (from client logs)
