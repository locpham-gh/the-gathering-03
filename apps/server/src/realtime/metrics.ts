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
  snapshot_players_per_client_avg: 0,
  snapshot_bytes_per_tick: 0,
  snapshot_recipients: 0,
  delta_players_sent: 0,
  keyframe_rate: 0,
  ws_out_bytes_per_tick: 0,
  ws_in_bytes_per_tick: 0,
};

const timings = {
  tick_ms_p50: 0,
  tick_ms_p95: 0,
};

let wsInBytesTick = 0;
let wsOutBytesTick = 0;
let keyframesTick = 0;
let deltasTick = 0;

const recentTickDurations: number[] = [];

export const metrics = {
  inc(counter: CounterName, delta = 1) {
    counters[counter] += delta;
  },
  setGauge(name: keyof typeof gauges, value: number) {
    gauges[name] = value;
  },
  observeSnapshotStats(totalPlayersInSnapshots: number, recipients: number, totalBytes: number) {
    gauges.snapshot_players_per_client_avg =
      recipients > 0 ? Number((totalPlayersInSnapshots / recipients).toFixed(2)) : 0;
    gauges.snapshot_bytes_per_tick = totalBytes;
    gauges.snapshot_recipients = recipients;
    gauges.delta_players_sent = totalPlayersInSnapshots;
  },
  observeWsInBytes(bytes: number) {
    wsInBytesTick += bytes;
  },
  observeWsOutBytes(bytes: number) {
    wsOutBytesTick += bytes;
  },
  observeKeyframe(isKeyframe: boolean) {
    if (isKeyframe) keyframesTick += 1;
    else deltasTick += 1;
  },
  endTick() {
    gauges.ws_in_bytes_per_tick = wsInBytesTick;
    gauges.ws_out_bytes_per_tick = wsOutBytesTick;
    const total = keyframesTick + deltasTick;
    gauges.keyframe_rate = total > 0 ? Number((keyframesTick / total).toFixed(3)) : 0;
    wsInBytesTick = 0;
    wsOutBytesTick = 0;
    keyframesTick = 0;
    deltasTick = 0;
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
