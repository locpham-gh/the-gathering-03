export interface RedisSnapshotBridge {
  publish(roomId: string, payload: unknown): Promise<void>;
  subscribe(onMessage: (roomId: string, payload: unknown) => void): Promise<void>;
}

class NoopSnapshotBridge implements RedisSnapshotBridge {
  async publish(): Promise<void> {}
  async subscribe(): Promise<void> {}
}

class BunRedisSnapshotBridge implements RedisSnapshotBridge {
  private pub: any;
  private sub: any;
  private channelPrefix = "the-gathering:realtime:snapshot:";

  constructor(redisUrl: string) {
    this.pub = new (Bun as any).Redis(redisUrl);
    this.sub = new (Bun as any).Redis(redisUrl);
  }

  async publish(roomId: string, payload: unknown): Promise<void> {
    await this.pub.publish(`${this.channelPrefix}${roomId}`, JSON.stringify(payload));
  }

  async subscribe(onMessage: (roomId: string, payload: unknown) => void): Promise<void> {
    await this.sub.psubscribe(`${this.channelPrefix}*`, (message: string, channel: string) => {
      const roomId = channel.replace(this.channelPrefix, "");
      try {
        onMessage(roomId, JSON.parse(message));
      } catch {
        // ignore malformed message
      }
    });
  }
}

export const createSnapshotBridge = (): RedisSnapshotBridge => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return new NoopSnapshotBridge();
  return new BunRedisSnapshotBridge(redisUrl);
};
