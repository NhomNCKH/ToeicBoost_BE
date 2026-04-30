import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
        return new Redis(redisUrl);
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
