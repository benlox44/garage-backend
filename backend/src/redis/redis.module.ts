import { Module } from '@nestjs/common';

import { RedisProvider } from './redis.provider.js';
import { JwtRedisService } from './services/jwt-redis.service.js';
import { UsersRedisService } from './services/users-redis.service.js';

@Module({
  providers: [RedisProvider, JwtRedisService, UsersRedisService],
  exports: [RedisProvider, JwtRedisService, UsersRedisService],
})
export class RedisModule {}
