import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkOrderItem } from './entities/work-order-item.entity.js';
import { WorkOrderNote } from './entities/work-order-note.entity.js';
import { WorkOrder } from './entities/work-order.entity.js';
import { WorkOrdersController } from './work-orders.controller.js';
import { WorkOrdersService } from './work-orders.service.js';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';
import { VehiclesModule } from '../vehicles/vehicles.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder, WorkOrderItem, WorkOrderNote]),
    VehiclesModule,
    UsersModule,
    NotificationsModule,
    InventoryModule
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
