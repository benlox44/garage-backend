import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { Appointment } from './entities/appointment.entity.js';

import { SchedulesModule } from '../schedules/schedules.module.js';
import { UsersModule } from '../users/users.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    SchedulesModule,
    UsersModule,
    VehiclesModule,
    NotificationsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
