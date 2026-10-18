import { PrismaClient } from '@prisma/client';
import net from 'net';

const basePrisma = new PrismaClient();
let isDbReachable: boolean | null = null;
let lastCheckTime = 0;

export async function isPostgresAlive(): Promise<boolean> {
  const now = Date.now();
  // Cache status check for 5 seconds to avoid overhead
  if (isDbReachable !== null && (now - lastCheckTime < 5000)) {
    return isDbReachable;
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(400); // 400ms fast check

    socket.on('connect', () => {
      socket.destroy();
      isDbReachable = true;
      lastCheckTime = Date.now();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      isDbReachable = false;
      lastCheckTime = Date.now();
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      isDbReachable = false;
      lastCheckTime = Date.now();
      resolve(false);
    });

    socket.connect(5432, '127.0.0.1');
  });
}

// Proxy prisma client to fail-fast if PostgreSQL is offline
export const prisma: PrismaClient = new Proxy(basePrisma, {
  get(target: any, prop: string) {
    const original = target[prop];
    if (typeof original === 'object' && original !== null) {
      return new Proxy(original, {
        get(modelTarget: any, modelProp: string) {
          const method = modelTarget[modelProp];
          if (typeof method === 'function') {
            return async (...args: any[]) => {
              const alive = await isPostgresAlive();
              if (!alive) {
                throw new Error('PostgreSQL database is offline.');
              }
              return Promise.race([
                method.apply(modelTarget, args),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('PostgreSQL query timeout')), 800)
                ),
              ]);
            };
          }
          return method;
        },
      });
    }
    if (typeof original === 'function') {
      return async (...args: any[]) => {
        const alive = await isPostgresAlive();
        if (!alive) {
          throw new Error('PostgreSQL database is offline.');
        }
        return original.apply(target, args);
      };
    }
  },
}) as unknown as PrismaClient;

export default prisma;
