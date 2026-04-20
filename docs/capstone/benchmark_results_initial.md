# Initial Benchmark Results (Protocol V2 Baseline)

Execution date: 2026-04-20  
Environment: local machine, single server node, in-memory state adapter  
Tool: `tools/bench/ws-load.ts`

## Scenario results

| Scenario | Clients | Duration | Opened | Closed | Messages | InputSent | Msg/s |
| --- | --- | --- | --- | --- | --- | --- | --- |
| bench20 | 20 | 15s | 20 | 20 | 5900 | 2960 | 393.28 |
| bench50 | 50 | 15s | 50 | 50 | 14700 | 7400 | 979.87 |
| bench100 | 100 | 15s | 100 | 100 | 29293 | 14800 | 1952.48 |

## Server metrics snapshot after run

```json
{
  "counters": {
    "ws_connections_opened": 170,
    "ws_connections_closed": 170,
    "ws_messages_received": 25330,
    "ws_messages_sent": 1387,
    "ws_input_rejected": 0,
    "ws_input_applied": 25139,
    "ws_heartbeat_timeouts": 0,
    "ws_snapshot_broadcasts": 877
  },
  "gauges": {
    "rooms_active": 0,
    "players_active": 0
  },
  "timings": {
    "tick_ms_p50": 0,
    "tick_ms_p95": 1
  }
}
```

## Notes

- This is a local baseline and not yet representative of distributed deployments.
- No heartbeat timeout observed in tested durations.
- Next step: repeat with Redis bridge enabled and compare snapshot broadcast behavior across instances.
