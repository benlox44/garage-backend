import { Controller, Get, Patch, Param, UseGuards, Request, Query, ParseBoolPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Notification } from './entities/notification.entity.js';
import { NotificationsService } from './notifications.service.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { ApiResponse } from '../common/index.js';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  public constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  public async listNotifications(
    @Request() req: AuthRequest,
    @Query('read', new ParseBoolPipe({ optional: true })) read: boolean | undefined,
    @Query('markAllRead', new ParseBoolPipe({ optional: true })) markAllRead: boolean | undefined,
  ): Promise<ApiResponse<Notification[] | null>> {
    if (markAllRead === true) {
      await this.notificationsService.markAllAsRead(req.user.sub);
      return {
        success: true,
        message: 'All notifications marked as read',
        data: null
      };
    }

    const notifications = await this.notificationsService.getNotifications(req.user.sub, read);
    
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications
    };
  }

  @Get(':id')
  public async getNotification(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<ApiResponse<Notification>> {
    const notification = await this.notificationsService.getNotificationById(id, req.user.sub);
    return {
      success: true,
      message: 'Notification retrieved successfully',
      data: notification
    };
  }

  @Patch(':id')
  public async updateNotification(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<ApiResponse<Notification>> {
    const notification = await this.notificationsService.markAsRead(id, req.user.sub);
    return {
      success: true,
      message: 'Notification marked as read',
      data: notification
    };
  }
}
