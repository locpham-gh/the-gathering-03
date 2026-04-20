# Final Demo Plan (Systems/Realtime Capstone)

## Demo objective

Demonstrate that The Gathering moved from client-trusting realtime to a protocol-driven, server-authoritative architecture with measurable performance signals.

## Demo flow (8-10 minutes)

1. **Protocol handshake**
   - Show websocket `welcome` and `snapshot` traffic in browser network tab.
2. **Authoritative simulation**
   - Move multiple clients in same room and show server snapshots continue to drive remote player state.
3. **Reconciliation**
   - Introduce temporary local drift (latency/throttling) and show local player re-aligns to authoritative coordinates.
4. **Metrics dashboard**
   - Open `/api/realtime/metrics` and explain counters/gauges/timings.
5. **Load harness**
   - Run 20, 50, 100 client benchmark commands and show summary output.
6. **Scalability bridge**
   - Explain Redis bridge path (`REDIS_URL`) and fallback behavior.

## What to highlight academically

- Protocol versioning and backward compatibility (`move` -> `input` bridge).
- Sequence-based input validation and anti-cheat implications.
- Tradeoff between smooth local UX and authoritative consistency.
- Observability-first engineering to support empirical evaluation.

## Backup plan

- If live benchmark is unstable, replay saved benchmark outputs from:
  - `docs/capstone/benchmark_results_initial.md`
