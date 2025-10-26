import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsModule } from './appointments/appointments.module.js';
import { Appointment } from './appointments/entities/appointment.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { required } from './common/config/env.config.js';
import { RoleGuard } from './guards/role.guard.js';
import { VehicleOwnerGuard } from './guards/vehicle-owner.guard.js';
import { GlobalJwtModule } from './jwt/jwt.module.js';
import { MechanicSchedule } from './schedules/entities/mechanic-schedule.entity.js';
import { SchedulesModule } from './schedules/schedules.module.js';
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
      entities: [User, Vehicle, MechanicSchedule, Appointment],
      // Use env flag to control schema sync (never enable in production)
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      // Enable SSL for managed clouds like Azure when DATABASE_SSL=true
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    }),
    GlobalJwtModule,
    UsersModule,
    VehiclesModule,
    SchedulesModule,
    AppointmentsModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  providers: [RoleGuard, VehicleOwnerGuard],
})
export class AppModule {}
