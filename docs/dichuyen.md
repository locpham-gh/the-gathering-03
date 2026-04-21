Các file chính liên quan trực tiếp đến logic di chuyển nhân vật trong project hiện tại:

- `apps/client/src/components/game/Player.tsx`  
  - game loop local (`useTick`), đọc phím, tính intent, resolve collision theo trục, reconcile với server, gửi update vị trí.
- `apps/client/src/components/game/hooks/usePlayerInput.ts`  
  - quản lý input bàn phím (WASD/Arrow), clear key khi blur/hidden để tránh trôi.
- `apps/client/src/components/game/hooks/useCollision.ts`  
  - tính va chạm từ map layers/collision tiles.
- `apps/client/src/hooks/useMultiplayer.ts`  
  - gửi input qua WebSocket (`input seq/dx/dy`), nhận snapshot authoritative, heartbeat, đồng bộ self/remote.
- `apps/server/src/realtime/state.ts`  
  - server authority apply input (`applyInputAuthoritatively`), spawn state, giới hạn world.
- `apps/server/src/index.ts`  
  - WebSocket realtime loop: nhận `input`, queue theo player, tick snapshot, ack/reject input.
- `apps/client/src/components/game/lib/constants.ts`  
  - hằng số movement/collision (`MOVEMENT_SPEED`, `TILE_SIZE_VIRTUAL`, spawn mặc định...).
- `apps/client/src/components/game/GameCanvas.tsx`  
  - scene chính chứa `Player`, `OtherPlayer`, map load, world container (sorting/layer ảnh hưởng cảm giác di chuyển hiển thị).

Liên quan hiển thị chuyển động (không phải core movement nhưng ảnh hưởng cảm nhận):
- `apps/client/src/components/game/OtherPlayer.tsx` (lerp remote player)
- `apps/client/src/components/game/AnimatedPlayerSprite.tsx` (animation + anchor/zIndex)