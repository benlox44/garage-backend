import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
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
import { ApiResponse } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('work-orders')
@UseGuards(AuthGuard('jwt'))
export class WorkOrdersController {
  public constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  public async listWorkOrders(
    @Request() req: AuthRequest,
    @Query('status') status: string | undefined,
    @Query('clientId') clientId: number | undefined,
    @Query('mechanicId') mechanicId: number | undefined,
    @Query('licensePlate') licensePlate: string | undefined,
  ): Promise<ApiResponse<WorkOrder[]>> {
    const workOrders = await this.workOrdersService.findAll(
      req.user.sub,
      req.user.role,
      status,
      clientId,
      mechanicId,
      licensePlate,
    );
    return {
      success: true,
      message: 'Work orders retrieved successfully',
      data: workOrders
    };
  }

  @Get(':id')
  public async getWorkOrder(@Param('id') id: number): Promise<ApiResponse<WorkOrder>> {
    const workOrder = await this.workOrdersService.getWorkOrderById(id);
    return {
      success: true,
      message: 'Work order retrieved successfully',
      data: workOrder
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async createWorkOrder(
    @Request() req: AuthRequest,
    @Body() createWorkOrderDto: CreateWorkOrderDto
  ): Promise<ApiResponse<WorkOrder>> {
    const workOrder = await this.workOrdersService.createWorkOrder(req.user.sub, createWorkOrderDto);
    return {
      success: true,
      message: 'Work order created successfully',
      data: workOrder
    };
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async updateWorkOrder(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() updateWorkOrderDto: UpdateWorkOrderDto
  ): Promise<ApiResponse<WorkOrder>> {
    const workOrder = await this.workOrdersService.updateWorkOrderStatus(
      id,
      req.user.sub,
      updateWorkOrderDto
    );
    return {
      success: true,
      message: 'Work order updated successfully',
      data: workOrder
    };
  }

  // ===== NESTED RESOURCES: ITEMS =====

  @Post(':id/items')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async addItemsToWorkOrder(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() addItemsDto: AddWorkOrderItemsDto
  ): Promise<ApiResponse<WorkOrder>> {
    const workOrder = await this.workOrdersService.addItemsToWorkOrder(
      id,
      req.user.sub,
      addItemsDto
    );
    return {
      success: true,
      message: 'Items added successfully',
      data: workOrder
    };
  }

  @Patch(':id/items/:itemId')
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async approveWorkOrderItem(
    @Param('id') workOrderId: number,
    @Param('itemId') itemId: number,
    @Request() req: AuthRequest
  ): Promise<ApiResponse<null>> {
    await this.workOrdersService.approveItem(itemId, req.user.sub);
    return {
      success: true,
      message: 'Item approved successfully',
      data: null
    };
  }

  // ===== NESTED RESOURCES: NOTES =====

  @Post(':id/notes')
  public async addNoteToWorkOrder(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() createNoteDto: CreateWorkOrderNoteDto
  ): Promise<ApiResponse<WorkOrderNote>> {
    const note = await this.workOrdersService.addNote(id, req.user.sub, createNoteDto);
    return {
      success: true,
      message: 'Note added successfully',
      data: note
    };
  }
}
