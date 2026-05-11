import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

function buildRedisUrlFromEnv(): string {
  const explicitUrl = process.env.REDIS_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const host = process.env.REDIS_HOST?.trim() || '127.0.0.1';
  const port = Number(process.env.REDIS_PORT || '6379');
  const db = Number(process.env.REDIS_DB || '0');
  const password = process.env.REDIS_PASSWORD?.trim();
  const auth = password ? `:${encodeURIComponent(password)}@` : '';

  return `redis://${auth}${host}:${port}/${db}`;
}

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisUrl = buildRedisUrlFromEnv();
        return new Redis(redisUrl);
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
