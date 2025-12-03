import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { InventoryItem } from './entities/inventory-item.entity.js';

import { NOTIFICATION_TYPE, type NotificationType } from '../common/constants/notification-type.constant.js';
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

  // ===== POST METHODS =====

  public async create(dto: CreateInventoryItemDto): Promise<InventoryItem> {
    await this.ensureSkuIsAvailable(dto.sku);

    const item = this.inventoryRepository.create(dto);
    return await this.inventoryRepository.save(item);
  }

  // ===== GET METHODS =====

  public async findAll(): Promise<InventoryItem[]> {
    return await this.inventoryRepository.find({
      order: { name: 'ASC' }
    });
  }

  public async findLowStock(): Promise<InventoryItem[]> {
    const items = await this.inventoryRepository
      .createQueryBuilder('item')
      .where('item.quantity <= item.minStock')
      .orderBy('item.quantity', 'ASC')
      .getMany();
    
    return items;
  }

  public async findOne(id: number): Promise<InventoryItem> {
    const item = await this.inventoryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  public async findBySku(sku: string): Promise<InventoryItem | null> {
    return await this.inventoryRepository.findOne({ where: { sku } });
  }

  // ===== PATCH METHODS =====

  public async update(id: number, dto: UpdateInventoryItemDto): Promise<InventoryItem> {
    const item = await this.findOne(id);

    Object.assign(item, dto);

    return await this.inventoryRepository.save(item);
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

  // ===== DELETE METHODS =====

  public async remove(id: number): Promise<void> {
    const item = await this.findOne(id);
    await this.inventoryRepository.remove(item);
  }

  // ===== AUXILIARY METHODS =====

  private async ensureSkuIsAvailable(sku: string): Promise<void> {
    const existingItem = await this.findBySku(sku);
    if (existingItem) {
      throw new ConflictException('SKU already exists');
    }
  }

  private async notifyAdminsLowStock(item: InventoryItem): Promise<void> {
    const admins = await this.usersService.findAdmins();

    for (const admin of admins) {
      await this.notificationsService.createNotification({
        userId: admin.id,
        type: NOTIFICATION_TYPE.INVENTORY_LOW_STOCK as NotificationType,
        title: 'Alerta de Stock Crítico',
        message: `El artículo "${item.name}" (SKU: ${item.sku}) tiene un stock bajo: ${item.quantity} unidades.`,
        metadata: { inventoryItemId: item.id, currentStock: item.quantity }
      });
    }
  }
}
