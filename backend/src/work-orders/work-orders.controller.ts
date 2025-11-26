import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AddWorkOrderItemsDto } from './dto/add-work-order-items.dto.js';
import { CreateWorkOrderNoteDto } from './dto/create-work-order-note.dto.js';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto.js';
import { WorkOrderNote } from './entities/work-order-note.entity.js';
import { WorkOrder } from './entities/work-order.entity.js';
import { WorkOrdersService } from './work-orders.service.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { ROLE } from '../common/constants/role.constant.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('work-orders')
@UseGuards(AuthGuard('jwt'))
export class WorkOrdersController {
  public constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async createWorkOrder(
    @Request() req: AuthRequest,
    @Body() createWorkOrderDto: CreateWorkOrderDto
  ): Promise<{ message: string; data: WorkOrder }> {
    const workOrder = await this.workOrdersService.createWorkOrder(req.user.sub, createWorkOrderDto);
    return {
      message: 'Work order created successfully',
      data: workOrder
    };
  }

  @Get('client')
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async getClientWorkOrders(@Request() req: AuthRequest): Promise<{ data: WorkOrder[] }> {
    const workOrders = await this.workOrdersService.getWorkOrdersByClient(req.user.sub);
    return { data: workOrders };
  }

  @Get('mechanic')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async getMechanicWorkOrders(@Request() req: AuthRequest): Promise<{ data: WorkOrder[] }> {
    const workOrders = await this.workOrdersService.getWorkOrdersByMechanic(req.user.sub);
    return { data: workOrders };
  }

  @Get('vehicle/:licensePlate')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC, ROLE.CLIENT)
  public async getWorkOrdersByLicensePlate(@Param('licensePlate') licensePlate: string): Promise<{ data: WorkOrder[] }> {
    const workOrders = await this.workOrdersService.getWorkOrdersByLicensePlate(licensePlate);
    return { data: workOrders };
  }

  @Get(':id')
  public async getWorkOrderById(@Param('id') id: number): Promise<{ data: WorkOrder }> {
    const workOrder = await this.workOrdersService.getWorkOrderById(id);
    return { data: workOrder };
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async updateWorkOrder(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto
  ): Promise<{ message: string; data: WorkOrder }> {
    const workOrder = await this.workOrdersService.updateWorkOrderStatus(
      id,
      req.user.sub,
      updateWorkOrderDto
    );
    return {
      message: 'Work order updated successfully',
      data: workOrder
    };
  }

  @Post(':id/items')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async addItems(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() addItemsDto: AddWorkOrderItemsDto
  ): Promise<{ message: string; data: WorkOrder }> {
    const workOrder = await this.workOrdersService.addItemsToWorkOrder(
      id,
      req.user.sub,
      addItemsDto
    );
    return {
      message: 'Items added successfully',
      data: workOrder
    };
  }

  @Patch('items/:itemId/approve')
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async approveItem(
    @Param('itemId') itemId: number,
    @Request() req: AuthRequest
  ): Promise<{ message: string }> {
    await this.workOrdersService.approveItem(itemId, req.user.sub);
    return { message: 'Item approved successfully' };
  }

  @Post(':id/notes')
  public async addNote(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() createNoteDto: CreateWorkOrderNoteDto
  ): Promise<{ message: string; data: WorkOrderNote }> {
    const note = await this.workOrdersService.addNote(id, req.user.sub, createNoteDto);
    return {
      message: 'Note added successfully',
      data: note
    };
  }
}
