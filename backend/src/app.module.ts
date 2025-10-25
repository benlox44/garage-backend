import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module.js';
import { required } from './common/config/env.config.js';
import { GlobalJwtModule } from './jwt/jwt.module.js';
import { User } from './users/entities/user.entity.js';
import { UsersModule } from './users/users.module.js';
import { Vehicle } from './vehicles/entities/vehicle.entity.js';
import { VehiclesModule } from './vehicles/vehicles.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: required('DATABASE_HOST'),
      port: parseInt(required('DATABASE_PORT'), 10),
      username: required('DATABASE_USER'),
      password: required('DATABASE_PASSWORD'),
      database: required('DATABASE_NAME'),
      entities: [User, Vehicle],
      // Use env flag to control schema sync (never enable in production)
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      // Enable SSL for managed clouds like Azure when DATABASE_SSL=true
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    }),
    GlobalJwtModule,
    UsersModule,
    VehiclesModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
