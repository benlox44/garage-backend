import { Controller, Get, Patch, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Notification } from './entities/notification.entity.js';
import { NotificationsService } from './notifications.service.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  public constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  public async getNotifications(@Request() req: AuthRequest): Promise<{ data: Notification[] }> {
    const notifications = await this.notificationsService.getNotificationsByUser(req.user.sub);
    return { data: notifications };
  }

  @Get('unread')
  public async getUnreadNotifications(@Request() req: AuthRequest): Promise<{ data: Notification[] }> {
    const notifications = await this.notificationsService.getUnreadNotifications(req.user.sub);
    return { data: notifications };
  }

  @Patch(':id/read')
  public async markAsRead(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<{ message: string }> {
    await this.notificationsService.markAsRead(id, req.user.sub);
    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  public async markAllAsRead(@Request() req: AuthRequest): Promise<{ message: string }> {
    await this.notificationsService.markAllAsRead(req.user.sub);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  public async deleteNotification(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<{ message: string }> {
    await this.notificationsService.delete(id, req.user.sub);
    return { message: 'Notification deleted' };
  }
}
