import { Redis } from 'ioredis';

import { required } from 'src/common/config/env.config';

export const RedisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: async (): Promise<Redis> => {
    const Redis = await import('ioredis');
    const useTls = process.env.REDIS_TLS === 'true';
    const host = required('REDIS_HOST');
    const port = Number(process.env.REDIS_PORT ?? (useTls ? '6380' : '6379'));
    const password = process.env.REDIS_PASSWORD;

    return new Redis.default({
      host,
      port,
      ...(useTls ? { tls: {} } : {}),
      ...(password ? { password } : {}),
    });
  },
};
