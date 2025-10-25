import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesController } from './vehicles.controller.js';
import { VehiclesService } from './vehicles.service.js';

import { RoleGuard } from '../guards/role.guard.js';
import { VehicleOwnerGuard } from '../guards/vehicle-owner.guard.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    UsersModule, // Para los guards
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, RoleGuard, VehicleOwnerGuard],
  exports: [VehiclesService],
})
export class VehiclesModule {}
