import Redis from 'ioredis';
import { config } from '../config';

class RedisManager {
  public client: Redis | null = null;
  public subClient: Redis | null = null;
  public pubClient: Redis | null = null;
  public isConnected: boolean = false;
  private memoryStore: Map<string, string> = new Map();
  private memorySubscribers: Map<string, Set<(channel: string, message: string) => void>> = new Map();

  constructor() {
    try {
      this.client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        connectTimeout: 400,
        enableOfflineQueue: false,
        retryStrategy(times) {
          if (times > 1) {
            return null; // Stop retrying quickly
          }
          return 100;
        },
        lazyConnect: true,
      });

      this.pubClient = this.client.duplicate();
      this.subClient = this.client.duplicate();

      const silenceErr = () => { this.isConnected = false; };
      this.client.on('error', silenceErr);
      this.pubClient.on('error', silenceErr);
      this.subClient.on('error', silenceErr);

      this.client.on('connect', () => {
        console.log('[Redis] Primary client connected.');
        this.isConnected = true;
      });
    } catch {
      this.isConnected = false;
    }
  }

  public async connect(): Promise<void> {
    if (!this.client) return;
    try {
      await Promise.race([
        Promise.all([
          this.client.connect().catch(() => {}),
          this.pubClient?.connect().catch(() => {}),
          this.subClient?.connect().catch(() => {}),
        ]),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ]);
    } catch {
      this.isConnected = false;
    }
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch {
        this.isConnected = false;
      }
    }
    this.memoryStore.set(key, value);
  }

  public async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch {
        this.isConnected = false;
      }
    }
    return this.memoryStore.get(key) || null;
  }

  public async publish(channel: string, message: string): Promise<void> {
    if (this.isConnected && this.pubClient) {
      try {
        await this.pubClient.publish(channel, message);
        return;
      } catch {
        this.isConnected = false;
      }
    }
    // In-memory fallback dispatch
    const subs = this.memorySubscribers.get(channel);
    if (subs) {
      subs.forEach((callback) => callback(channel, message));
    }
  }

  public async subscribe(channel: string, callback: (channel: string, message: string) => void): Promise<void> {
    if (this.isConnected && this.subClient) {
      try {
        await this.subClient.subscribe(channel);
        this.subClient.on('message', (chan, msg) => {
          if (chan === channel) {
            callback(chan, msg);
          }
        });
        return;
      } catch {
        this.isConnected = false;
      }
    }

    // In-memory fallback subscribe
    if (!this.memorySubscribers.has(channel)) {
      this.memorySubscribers.set(channel, new Set());
    }
    this.memorySubscribers.get(channel)!.add(callback);
  }

  public async psubscribe(pattern: string, callback: (pattern: string, channel: string, message: string) => void): Promise<void> {
    if (this.isConnected && this.subClient) {
      try {
        await this.subClient.psubscribe(pattern);
        this.subClient.on('pmessage', (pat, chan, msg) => {
          if (pat === pattern || chan.startsWith(pattern.replace('*', ''))) {
            callback(pat, chan, msg);
          }
        });
        return;
      } catch {
        this.isConnected = false;
      }
    }

    // Fallback logic for pattern
    const prefix = pattern.replace('*', '');
    if (!this.memorySubscribers.has('__pattern_listener__')) {
      this.memorySubscribers.set('__pattern_listener__', new Set());
    }
    this.memorySubscribers.get('__pattern_listener__')!.add((chan, msg) => {
      if (chan.startsWith(prefix)) {
        callback(pattern, chan, msg);
      }
    });
  }
}

export const redisManager = new RedisManager();
export default redisManager;
