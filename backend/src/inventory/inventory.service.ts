import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { InventoryItem } from './entities/inventory-item.entity.js';

import { NOTIFICATION_TYPE } from '../common/constants/notification-type.constant.js';
import { ROLE } from '../common/constants/role.constant.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class InventoryService {
  public constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepository: Repository<InventoryItem>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService
  ) {}

  public async findOne(id: number): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    return item;
  }

  public async updateStock(id: number, delta: number): Promise<InventoryItem> {
    const item = await this.findOne(id);
    
    item.quantity += delta;
    const savedItem = await this.inventoryRepository.save(item);

    if (savedItem.quantity <= savedItem.minStock) {
      await this.notifyAdminsLowStock(savedItem);
    }

    return savedItem;
  }

  private async notifyAdminsLowStock(item: InventoryItem): Promise<void> {
    const admins = await this.usersService.findAdmins();

    
    for (const admin of admins) {
      await this.notificationsService.createNotification({
        userId: admin.id,
        type: NOTIFICATION_TYPE.INVENTORY_LOW_STOCK,
        title: 'Alerta de Stock Crítico',
        message: `El artículo "${item.name}" (SKU: ${item.sku}) tiene un stock bajo: ${item.quantity} unidades.`,
        metadata: { inventoryItemId: item.id, currentStock: item.quantity }
      });
    }
  }
}
