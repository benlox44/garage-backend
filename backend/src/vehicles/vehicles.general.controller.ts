import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard, Roles } from '../guards/role.guard.js';
import { ROLE } from '../common/constants/role.constant.js';
import { VehiclesService } from './vehicles.service.js';
import { Vehicle } from './entities/vehicle.entity.js';

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class VehiclesGeneralController {
  public constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('search')
  @Roles(ROLE.MECHANIC, ROLE.ADMIN)
  public async search(@Query('query') query: string): Promise<{ data: Vehicle[] }> {
    const data = await this.vehiclesService.searchByLicensePlate(query);
    return { data };
  }
}
