import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { RoleGuard, Roles } from '../guards/role.guard.js';
import { VehicleOwnerGuard } from '../guards/vehicle-owner.guard.js';
import { CurrentUser } from '../jwt/decorators/current-user.decorator.js';
import { JwtPayload } from '../jwt/types/jwt-payload.type.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Controller('users/me/vehicles')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class VehiclesController {
  public constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly notificationsService: NotificationsService
  ) {}

  @Post()
  @Roles('CLIENT')
  public async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVehicleDto,
  ): Promise<{ message: string }> {
    await this.vehiclesService.create(user.sub, dto);
    return {
      message: 'Vehicle created successfully',
    };
  }

  @Get()
  @Roles('CLIENT')
  public async findAll(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: Vehicle[] }> {
    const data = await this.vehiclesService.findAllByClient(user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles('CLIENT')
  @UseGuards(VehicleOwnerGuard)
  public async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ): Promise<{ message: string }> {
    await this.vehiclesService.update(id, dto);
    return {
      message: 'Vehicle updated successfully',
    };
  }

  @Delete(':id')
  @Roles('CLIENT')
  @UseGuards(VehicleOwnerGuard)
  public async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.vehiclesService.remove(id);
    return {
      message: 'Vehicle deleted successfully',
    };
  }

  @Patch(':id/status')
  @Roles(ROLE.MECHANIC)
  public async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleStatusDto,
  ): Promise<{ message: string }> {
    const vehicle = await this.vehiclesService.findOne(id);
    await this.vehiclesService.updateStatus(id, dto.status);

    await this.notificationsService.createNotification({
      userId: vehicle.clientId,
      type: NOTIFICATION_TYPE.VEHICLE_STATUS_CHANGED,
      title: 'Estado de vehículo actualizado',
      message: `El estado de su vehículo ${vehicle.brand} ${vehicle.model} ha cambiado a: ${dto.status}`,
      metadata: { vehicleId: id, newStatus: dto.status }
    });

    return {
      message: 'Vehicle status updated successfully',
    };
  }
}
