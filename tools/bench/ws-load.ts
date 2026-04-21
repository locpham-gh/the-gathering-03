/**
 * Basic websocket load harness for 20/50/100 clients.
 * Usage:
 *   bun tools/bench/ws-load.ts --url ws://localhost:3000/ws?room=bench --clients 20 --duration 30
 */

import { pack } from "msgpackr";

type Args = Record<string, string>;

const parseArgs = (): Args => {
  const args = process.argv.slice(2);
  const out: Args = {};
  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (!token.startsWith("--")) continue;
    out[token.slice(2)] = args[i + 1] ?? "";
  }
  return out;
};

const args = parseArgs();
const url = args.url || "ws://localhost:3000/ws?room=bench";
const clients = Number(args.clients || 20);
const durationSeconds = Number(args.duration || 30);
const apiBase = args.api || "http://localhost:3000";

let opened = 0;
let closed = 0;
let messages = 0;
let inputSent = 0;
const sockets: WebSocket[] = [];

const start = Date.now();

for (let i = 0; i < clients; i += 1) {
  const ws = new WebSocket(url);
  sockets.push(ws);

  ws.onopen = () => {
    opened += 1;
    ws.send(
      pack({
        type: "join",
        payload: { displayName: `bench-${i}`, character2d: "Adam" },
      }),
    );
  };

  ws.onmessage = () => {
    messages += 1;
  };

  ws.onclose = () => {
    closed += 1;
  };
}

const inputTimer = setInterval(() => {
  for (const ws of sockets) {
    if (ws.readyState !== ws.OPEN) continue;
    inputSent += 1;
    ws.send(
      pack({
        type: "input",
        payload: {
          seq: inputSent,
          dx: Math.random() * 2 - 1,
          dy: Math.random() * 2 - 1,
          isSitting: false,
        },
      }),
    );
  }
}, 100);

setTimeout(async () => {
  clearInterval(inputTimer);
  for (const ws of sockets) ws.close();
  const elapsed = (Date.now() - start) / 1000;
  const summary = {
    url,
    clients,
    durationSeconds,
    elapsedSeconds: Number(elapsed.toFixed(2)),
    opened,
    closed,
    messages,
    inputSent,
    msgsPerSec: Number((messages / elapsed).toFixed(2)),
  };
  try {
    const res = await fetch(`${apiBase}/api/realtime/metrics`);
    summary["serverMetrics"] = await res.json();
  } catch {
    summary["serverMetrics"] = "unavailable";
  }
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}, durationSeconds * 1000);
