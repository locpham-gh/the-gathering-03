# Realtime Protocol V2

This document defines the websocket protocol used by `apps/server/src/index.ts` and `apps/client/src/hooks/useMultiplayer.ts`.

## Goals

- Versioned protocol for safe evolution.
- Server-authoritative movement updates.
- Sequence-based input validation.
- Heartbeat-based liveness detection.
- Snapshot stream for reconciliation and reconnect.

## Transport

- Endpoint: `/ws?room=<roomId>`
- Message shape:

```json
{
  "type": "input",
  "payload": {}
}
```

## Client -> Server messages

- `join`
  - payload: `{ displayName?: string, avatarUrl?: string, character2d?: string }`
  - sent once after socket open.
- `input`
  - payload: `{ seq: number, dx: number, dy: number, isSitting?: boolean }`
  - `seq` must increase monotonically per client.
  - `dx` and `dy` normalized in `[-1, 1]`.
- `heartbeat`
  - payload: `{ lastSeq: number }`
  - sent every 5 seconds.
- `ack`
  - payload: `{ seq: number }`
  - optional acknowledgement of latest snapshot.

## Server -> Client messages

- `welcome`
  - payload: `{ protocolVersion: "v2", playerId: string, roomId: string }`
- `snapshot`
  - payload:
    - `roomId: string`
    - `seq: number` (room sequence)
    - `ts: number` (unix ms)
    - `players: Record<string, PlayerState>`
- `heartbeat_ack`
  - payload: `{ seq: number, ts: number }`
- `player_left`
  - payload: `{ id: string }`

## PlayerState shape

```json
{
  "id": "socket-id",
  "x": 1234,
  "y": 2200,
  "isSitting": false,
  "lastUpdate": 1710000000000,
  "profile": {
    "displayName": "User",
    "avatarUrl": "/assets/avatars/default-male.png",
    "character2d": "Adam"
  },
  "inputSeq": 42,
  "lastAckSeq": 42,
  "heartbeatAt": 1710000000000
}
```

## Backward compatibility

`type: "move"` is still accepted for old clients. Server converts absolute movement payload into normalized `input` semantics internally.

## Reliability constraints

- Heartbeat timeout: 15s.
- Tick rate: 50ms (20Hz snapshots).
- Duplicate or out-of-order input (`seq <= inputSeq`) is rejected.
