type CounterName =
  | "ws_connections_opened"
  | "ws_connections_closed"
  | "ws_messages_received"
  | "ws_messages_sent"
  | "ws_input_rejected"
  | "ws_input_applied"
  | "ws_heartbeat_timeouts"
  | "ws_snapshot_broadcasts";

const counters: Record<CounterName, number> = {
  ws_connections_opened: 0,
  ws_connections_closed: 0,
  ws_messages_received: 0,
  ws_messages_sent: 0,
  ws_input_rejected: 0,
  ws_input_applied: 0,
  ws_heartbeat_timeouts: 0,
  ws_snapshot_broadcasts: 0,
};

const gauges = {
  rooms_active: 0,
  players_active: 0,
};

const timings = {
  tick_ms_p50: 0,
  tick_ms_p95: 0,
};

const recentTickDurations: number[] = [];

export const metrics = {
  inc(counter: CounterName, delta = 1) {
    counters[counter] += delta;
  },
  setGauge(name: keyof typeof gauges, value: number) {
    gauges[name] = value;
  },
  observeTickMs(value: number) {
    recentTickDurations.push(value);
    if (recentTickDurations.length > 200) recentTickDurations.shift();
    const sorted = [...recentTickDurations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    timings.tick_ms_p50 = Number(p50.toFixed(2));
    timings.tick_ms_p95 = Number(p95.toFixed(2));
  },
  snapshot() {
    return {
      timestamp: Date.now(),
      counters: { ...counters },
      gauges: { ...gauges },
      timings: { ...timings },
    };
  },
};
