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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleStatusDto } from './dto/update-vehicle-status.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesService } from './vehicles.service.js';

import { NOTIFICATION_TYPE } from '../common/constants/notification-type.constant.js';
import { ROLE } from '../common/constants/role.constant.js';
import { ApiResponse } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';
import { VehicleOwnerGuard } from '../guards/vehicle-owner.guard.js';
import { CurrentUser } from '../jwt/decorators/current-user.decorator.js';
import { JwtPayload } from '../jwt/types/jwt-payload.type.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehiclesController {
  public constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Get()
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT, ROLE.MECHANIC)
  public async listVehicles(
    @CurrentUser() user: JwtPayload,
    @Query('clientId') clientId: number | undefined,
    @Query('status') status: string | undefined,
    @Query('licensePlate') licensePlate: string | undefined,
  ): Promise<ApiResponse<Vehicle[]>> {
    const data = await this.vehiclesService.findAll(user, clientId, status, licensePlate);
    return {
      success: true,
      message: 'Vehicles retrieved successfully',
      data,
    };
  }

  @Get(':id')
  public async getVehicle(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<Vehicle>> {
    const data = await this.vehiclesService.findOne(id);
    return {
      success: true,
      message: 'Vehicle retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async createVehicle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVehicleDto,
  ): Promise<ApiResponse<Vehicle>> {
    const data = await this.vehiclesService.create(user.sub, dto);
    return {
      success: true,
      message: 'Vehicle created successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(RoleGuard, VehicleOwnerGuard)
  @Roles(ROLE.CLIENT)
  public async updateVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ): Promise<ApiResponse<Vehicle>> {
    const data = await this.vehiclesService.update(id, dto);
    return {
      success: true,
      message: 'Vehicle updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(RoleGuard, VehicleOwnerGuard)
  @Roles(ROLE.CLIENT)
  public async deleteVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.vehiclesService.remove(id);
    return {
      success: true,
      message: 'Vehicle deleted successfully',
      data: null,
    };
  }

  @Patch(':id/status')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async updateVehicleStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleStatusDto,
  ): Promise<ApiResponse<Vehicle>> {
    const vehicle = await this.vehiclesService.findOne(id);
    const data = await this.vehiclesService.updateStatus(id, dto.status);

    await this.notificationsService.createNotification({
      userId: vehicle.clientId,
      type: NOTIFICATION_TYPE.VEHICLE_STATUS_CHANGED,
      title: 'Estado de vehículo actualizado',
      message: `El estado de su vehículo ${vehicle.brand} ${vehicle.model} ha cambiado a: ${dto.status}`,
      metadata: { vehicleId: id, newStatus: dto.status }
    });

    return {
      success: true,
      message: 'Vehicle status updated successfully',
      data,
    };
  }
}
