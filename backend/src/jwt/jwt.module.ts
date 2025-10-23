import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { required } from '../common/config/env.config.js';
import { RedisModule } from '../redis/redis.module.js';

import { AppJwtService } from './jwt.service.js';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: required('JWT_SECRET'),
    }),
    RedisModule,
  ],
  providers: [AppJwtService],
  exports: [AppJwtService, JwtModule],
})
export class GlobalJwtModule {}
