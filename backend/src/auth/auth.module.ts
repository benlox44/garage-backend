import { Module } from '@nestjs/common';

import { JwtStrategy } from './strategies/jwt.strategy.js';
import { MailModule } from '../mail/mail.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { UsersRedisService } from '../redis/services/users-redis.service.js';
import { UsersModule } from '../users/users.module.js';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
@Module({
  imports: [MailModule, RedisModule, UsersModule],
  providers: [AuthService, JwtStrategy, UsersRedisService],
  controllers: [AuthController],
})
export class AuthModule {}
