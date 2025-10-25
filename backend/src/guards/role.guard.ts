import { Injectable, CanActivate, ExecutionContext, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { type Role } from '../common/constants/role.constant.js';
import { UsersService } from '../users/users.service.js';

export const Roles = (...roles: Role[]): MethodDecorator => SetMetadata('roles', roles);

/**
 * RoleGuard
 * 
 * Generic role-based guard that checks if user has any of the required roles.
 * Use with @Roles('ADMIN', 'MECHANIC') decorator.
 * Must be used together with AuthGuard to ensure the user is authenticated first.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const req = context.switchToHttp().getRequest<AuthRequest>();
    const userId = req.user?.sub;

    if (!userId) {
      throw new ForbiddenException('Missing authenticated user');
    }

    const user = await this.usersService.findByIdOrThrow(userId);
    
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
