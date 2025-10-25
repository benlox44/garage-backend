import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';

import { AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

/**
 * VehicleOwnerGuard
 * 
 * Verifies that the authenticated user owns the vehicle specified in the route parameter.
 * Expects a route parameter named 'id' containing the vehicle ID.
 * Must be used together with AuthGuard to ensure the user is authenticated first.
 */
@Injectable()
export class VehicleOwnerGuard implements CanActivate {
  public constructor(private readonly vehiclesService: VehiclesService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const userId = req.user?.sub;
    const vehicleId = parseInt(req.params?.id, 10);

    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }

    if (!vehicleId || isNaN(vehicleId)) {
      throw new ForbiddenException('Valid vehicle ID required');
    }

    try {
      const vehicle = await this.vehiclesService.findOne(vehicleId);
      
      if (vehicle.clientId !== userId) {
        throw new ForbiddenException('You can only access your own vehicles');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }
      throw error;
    }
  }
}
