import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import { ROLE } from '../../common/constants/role.constant.js';
import { UsersService } from '../../users/users.service.js';

import { AuthRequest } from '../interfaces/auth-request.interface.js';

@Injectable()
export class AdminGuard implements CanActivate {
  public constructor(private readonly usersService: UsersService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const userId = req.user?.sub;

    if (!userId) throw new ForbiddenException('Missing authenticated user');

    const user = await this.usersService.findByIdOrThrow(userId);
    if (user.role !== ROLE.ADMIN) {
      throw new ForbiddenException('Admin privileges required');
    }

    return true;
  }
}

