import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryItem } from './entities/inventory-item.entity.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

import { NotificationsModule } from '../notifications/notifications.module.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryItem]),
    NotificationsModule,
    UsersModule
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
