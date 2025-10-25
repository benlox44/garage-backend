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
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { Vehicle } from './entities/vehicle.entity.js';
import { VehiclesService } from './vehicles.service.js';

import { RoleGuard, Roles } from '../guards/role.guard.js';
import { VehicleOwnerGuard } from '../guards/vehicle-owner.guard.js';
import { CurrentUser } from '../jwt/decorators/current-user.decorator.js';
import { JwtPayload } from '../jwt/types/jwt-payload.type.js';

/**
 * VehiclesController
 *
 * Controller responsible for managing client vehicles.
 * Only clients can access these endpoints.
 *
 * Endpoints organized by HTTP method: POST, GET, PATCH, DELETE
 */
@Controller('users/me/vehicles')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class VehiclesController {
  public constructor(private readonly vehiclesService: VehiclesService) {}

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
    await this.vehiclesService.update(id, user.sub, dto);
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
    await this.vehiclesService.remove(id, user.sub);
    return {
      message: 'Vehicle deleted successfully',
    };
  }
}
