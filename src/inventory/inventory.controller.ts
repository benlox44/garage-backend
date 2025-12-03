import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { InventoryItem } from './entities/inventory-item.entity.js';
import { InventoryService } from './inventory.service.js';

import { ROLE } from '../common/constants/role.constant.js';
import { ApiResponse } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class InventoryController {
  public constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(ROLE.ADMIN, ROLE.MECHANIC)
  public async findAll(): Promise<ApiResponse<InventoryItem[]>> {
    const data = await this.inventoryService.findAll();
    return {
      success: true,
      message: 'Inventory items retrieved successfully',
      data,
    };
  }

  @Get('low-stock')
  @Roles(ROLE.ADMIN, ROLE.MECHANIC)
  public async findLowStock(): Promise<ApiResponse<InventoryItem[]>> {
    const data = await this.inventoryService.findLowStock();
    return {
      success: true,
      message: 'Low stock items retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @Roles(ROLE.ADMIN, ROLE.MECHANIC)
  public async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<InventoryItem>> {
    const data = await this.inventoryService.findOne(id);
    return {
      success: true,
      message: 'Inventory item retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(ROLE.ADMIN)
  public async create(
    @Body() dto: CreateInventoryItemDto,
  ): Promise<ApiResponse<InventoryItem>> {
    const data = await this.inventoryService.create(dto);
    return {
      success: true,
      message: 'Inventory item created successfully',
      data,
    };
  }

  @Patch(':id')
  @Roles(ROLE.ADMIN)
  public async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<ApiResponse<InventoryItem>> {
    const data = await this.inventoryService.update(id, dto);
    return {
      success: true,
      message: 'Inventory item updated successfully',
      data,
    };
  }

  @Patch(':id/stock')
  @Roles(ROLE.ADMIN, ROLE.MECHANIC)
  public async updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStockDto,
  ): Promise<ApiResponse<InventoryItem>> {
    const data = await this.inventoryService.updateStock(id, dto.delta);
    return {
      success: true,
      message: 'Stock updated successfully',
      data,
    };
  }

  @Delete(':id')
  @Roles(ROLE.ADMIN)
  public async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.inventoryService.remove(id);
    return {
      success: true,
      message: 'Inventory item deleted successfully',
      data: null,
    };
  }
}
