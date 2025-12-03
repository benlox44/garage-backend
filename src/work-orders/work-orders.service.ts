import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { AddWorkOrderItemsDto } from './dto/add-work-order-items.dto.js';
import { CreateWorkOrderNoteDto } from './dto/create-work-order-note.dto.js';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto.js';
import { WorkOrderItem } from './entities/work-order-item.entity.js';
import { WorkOrderNote } from './entities/work-order-note.entity.js';
import { WorkOrder } from './entities/work-order.entity.js';

import { NOTIFICATION_TYPE } from '../common/constants/notification-type.constant.js';
import { ROLE } from '../common/constants/role.constant.js';
import { VEHICLE_STATUS } from '../common/constants/vehicle-status.constant.js';
import { WORK_ORDER_STATUS, type WorkOrderStatus } from '../common/constants/work-order-status.constant.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UsersService } from '../users/users.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

@Injectable()
export class WorkOrdersService {
  public constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrderRepository: Repository<WorkOrder>,
    @InjectRepository(WorkOrderItem)
    private readonly workOrderItemRepository: Repository<WorkOrderItem>,
    @InjectRepository(WorkOrderNote)
    private readonly workOrderNoteRepository: Repository<WorkOrderNote>,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly inventoryService: InventoryService
  ) {}

  public async createWorkOrder(
    mechanicId: number,
    createWorkOrderDto: CreateWorkOrderDto
  ): Promise<WorkOrder> {
    const { vehicleId, licensePlate, description, requestedServices, estimatedCost, items } = createWorkOrderDto;

    const mechanic = await this.usersService.findByIdOrThrow(mechanicId);
    if (mechanic.role !== ROLE.MECHANIC) {
      throw new BadRequestException('Only mechanics can create work orders');
    }

    let vehicle;
    if (licensePlate) {
      vehicle = await this.vehiclesService.findByLicensePlate(licensePlate);
    } else if (vehicleId) {
      vehicle = await this.vehiclesService.findOne(vehicleId);
    } else {
      throw new BadRequestException('Either vehicleId or licensePlate must be provided');
    }

    const workOrder = this.workOrderRepository.create({
      mechanicId,
      clientId: vehicle.clientId,
      vehicleId: vehicle.id,
      description,
      requestedServices,
      estimatedCost,
      status: WORK_ORDER_STATUS.PENDING_APPROVAL
    });

    const savedWorkOrder = await this.workOrderRepository.save(workOrder);

    if (items && items.length > 0) {
      // Process items sequentially to handle async inventory updates
      for (const item of items) {
        const totalPrice = item.quantity * item.unitPrice;
        const inventoryId = item.inventoryItemId as number | undefined;
        
        // If inventory item is linked, decrease stock
        if (inventoryId !== undefined) {
          await this.inventoryService.updateStock(inventoryId, -item.quantity);
        }

        const workOrderItem = this.workOrderItemRepository.create({
          workOrderId: savedWorkOrder.id,
          name: item.name,
          inventoryItemId: inventoryId ?? null,
          type: item.type,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
          requiresApproval: item.requiresApproval ?? false
        });
        
        await this.workOrderItemRepository.save(workOrderItem);
      }
    }

    await this.vehiclesService.updateStatus(vehicle.id, VEHICLE_STATUS.IN_SERVICE);

    await this.notificationsService.createNotification({
      userId: vehicle.clientId,
      type: NOTIFICATION_TYPE.WORK_ORDER_CREATED,
      title: 'Nueva orden de trabajo',
      message: `Se ha creado una nueva orden de trabajo para su vehículo ${vehicle.brand} ${vehicle.model}`,
      metadata: { workOrderId: savedWorkOrder.id, vehicleId: vehicle.id }
    });

    return this.getWorkOrderById(savedWorkOrder.id);
  }

  public async findAll(
    userId: number,
    userRole: string,
    status: string | undefined,
    clientId: number | undefined,
    mechanicId: number | undefined,
    licensePlate: string | undefined,
  ): Promise<WorkOrder[]> {
    const where: FindOptionsWhere<WorkOrder> = {};

    if (userRole === ROLE.CLIENT) {
      where.clientId = userId;
    } else if (userRole === ROLE.MECHANIC) {
      where.mechanicId = userId;
    }

    if (clientId && userRole !== ROLE.CLIENT) {
      where.clientId = clientId;
    }
    if (mechanicId && userRole !== ROLE.MECHANIC) {
      where.mechanicId = mechanicId;
    }

    if (status) {
      where.status = status as WorkOrderStatus;
    }

    if (licensePlate) {
      const vehicle = await this.vehiclesService.findByLicensePlate(licensePlate);
      where.vehicleId = vehicle.id;
    }

    return await this.workOrderRepository.find({
      where,
      relations: ['client', 'mechanic', 'vehicle', 'items'],
      order: { createdAt: 'DESC' }
    });
  }

  public async getWorkOrderById(id: number): Promise<WorkOrder> {
    const workOrder = await this.workOrderRepository.findOne({
      where: { id },
      relations: ['client', 'mechanic', 'vehicle', 'items', 'notes', 'notes.author'],
      order: { notes: { createdAt: 'DESC' } }
    });

    if (!workOrder) {
      throw new NotFoundException('Work order not found');
    }

    return workOrder;
  }

  public async getWorkOrdersByLicensePlate(licensePlate: string): Promise<WorkOrder[]> {
    const vehicle = await this.vehiclesService.findByLicensePlate(licensePlate);
    return this.workOrderRepository.find({
      where: { vehicleId: vehicle.id },
      relations: ['client', 'mechanic', 'vehicle', 'items'],
      order: { createdAt: 'DESC' }
    });
  }

  public async getWorkOrdersByClient(clientId: number): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      where: { clientId },
      relations: ['mechanic', 'vehicle', 'items', 'notes'],
      order: { createdAt: 'DESC' }
    });
  }

  public async getWorkOrdersByMechanic(mechanicId: number): Promise<WorkOrder[]> {
    return await this.workOrderRepository.find({
      where: { mechanicId },
      relations: ['client', 'vehicle', 'items', 'notes'],
      order: { createdAt: 'DESC' }
    });
  }

  public async updateWorkOrderStatus(
    id: number,
    mechanicId: number,
    updateWorkOrderDto: UpdateWorkOrderDto
  ): Promise<WorkOrder> {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.mechanicId !== mechanicId) {
      throw new ForbiddenException('You can only update your own work orders');
    }

    if (updateWorkOrderDto.status) {
      workOrder.status = updateWorkOrderDto.status;

      if (updateWorkOrderDto.status === WORK_ORDER_STATUS.COMPLETED) {
        await this.vehiclesService.updateStatus(workOrder.vehicleId, VEHICLE_STATUS.READY_FOR_PICKUP);
      }

      await this.notificationsService.createNotification({
        userId: workOrder.clientId,
        type: NOTIFICATION_TYPE.WORK_ORDER_STATUS_CHANGED,
        title: 'Estado de orden actualizado',
        message: `La orden de trabajo #${id} ha cambiado a: ${updateWorkOrderDto.status}`,
        metadata: { workOrderId: id, newStatus: updateWorkOrderDto.status }
      });
    }

    if (updateWorkOrderDto.finalCost !== undefined) {
      workOrder.finalCost = updateWorkOrderDto.finalCost;
    }

    return await this.workOrderRepository.save(workOrder);
  }

  public async addItemsToWorkOrder(
    id: number,
    mechanicId: number,
    addItemsDto: AddWorkOrderItemsDto
  ): Promise<WorkOrder> {
    const workOrder = await this.getWorkOrderById(id);

    if (workOrder.mechanicId !== mechanicId) {
      throw new ForbiddenException('You can only add items to your own work orders');
    }

    const workOrderItems: WorkOrderItem[] = [];

    for (const item of addItemsDto.items) {
      const totalPrice = item.quantity * item.unitPrice;
      const inventoryId = item.inventoryItemId as number | undefined;

      // If inventory item is linked, decrease stock
      if (inventoryId !== undefined) {
        await this.inventoryService.updateStock(inventoryId, -item.quantity);
      }

      const workOrderItem = this.workOrderItemRepository.create({
        workOrderId: id,
        name: item.name,
        inventoryItemId: inventoryId ?? null,
        type: item.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice,
        requiresApproval: item.requiresApproval ?? false
      });
      
      workOrderItems.push(workOrderItem);
    }

    await this.workOrderItemRepository.save(workOrderItems);

    const requiresApproval = workOrderItems.some(item => item.requiresApproval);
    if (requiresApproval) {
      await this.notificationsService.createNotification({
        userId: workOrder.clientId,
        type: NOTIFICATION_TYPE.ITEM_REQUIRES_APPROVAL,
        title: 'Artículos requieren aprobación',
        message: `Se han agregado nuevos artículos a la orden #${id} que requieren su aprobación`,
        metadata: { workOrderId: id }
      });
    }

    return this.getWorkOrderById(id);
  }

  public async approveItem(
    itemId: number,
    clientId: number
  ): Promise<void> {
    const item = await this.workOrderItemRepository.findOne({
      where: { id: itemId }
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const workOrder = await this.getWorkOrderById(item.workOrderId);

    if (workOrder.clientId !== clientId) {
      throw new ForbiddenException('You can only approve items from your own work orders');
    }

    if (!item.requiresApproval) {
      throw new BadRequestException('This item does not require approval');
    }

    if (item.isApproved) {
      throw new BadRequestException('This item is already approved');
    }

    item.isApproved = true;
    item.approvedAt = new Date();
    await this.workOrderItemRepository.save(item);
  }

  public async addNote(
    workOrderId: number,
    authorId: number,
    createNoteDto: CreateWorkOrderNoteDto
  ): Promise<WorkOrderNote> {
    const workOrder = await this.getWorkOrderById(workOrderId);

    const author = await this.usersService.findByIdOrThrow(authorId);

    if (author.role === ROLE.CLIENT && workOrder.clientId !== authorId) {
      throw new ForbiddenException('You can only add notes to your own work orders');
    }

    if (author.role === ROLE.MECHANIC && workOrder.mechanicId !== authorId) {
      throw new ForbiddenException('You can only add notes to your own work orders');
    }

    const note = this.workOrderNoteRepository.create({
      workOrderId,
      authorId,
      content: createNoteDto.content,
      imageUrl: createNoteDto.imageUrl ?? null
    });

    const savedNote = await this.workOrderNoteRepository.save(note);

    const notifyUserId = author.role === ROLE.MECHANIC ? workOrder.clientId : workOrder.mechanicId;
    await this.notificationsService.createNotification({
      userId: notifyUserId,
      type: NOTIFICATION_TYPE.NOTE_ADDED,
      title: 'Nueva nota agregada',
      message: `${author.name} ha agregado una nota a la orden #${workOrderId}`,
      metadata: { workOrderId, noteId: savedNote.id }
    });

    return savedNote;
  }
}
