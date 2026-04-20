# Capstone Artifacts Checklist

## 1) Architecture report

- Baseline architecture before realtime refactor
- Protocol v2 design and tradeoffs
- Server-authoritative simulation model
- Shared-state strategy and fallback modes

## 2) Experimental report

- Input rejection experiment (normal vs malformed client)
- Latency impact of reconciliation threshold
- Multi-instance behavior with and without Redis bridge

## 3) Benchmark report

- 20/50/100 client runs
- Throughput and tick latency plots
- Recovery behavior after forced disconnects

## 4) Security and reliability section

- Anti-cheat assumptions and limitations
- Heartbeat timeout behavior
- Known failure modes and mitigation

## 5) Demo package

- 5-minute technical walkthrough
- 3-minute live stress demo
- Dashboard/metrics screen capture
- Source code tags for each phase milestone
