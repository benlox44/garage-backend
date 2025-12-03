import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity.js';
import { NotificationsGateway } from './notifications.gateway.js';

import { type NotificationType } from '../common/constants/notification-type.constant.js';

export interface CreateNotificationDto {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  public constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway
  ) {}

  public async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata ?? null
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Send real-time notification
    this.notificationsGateway.sendNotificationToUser(dto.userId, savedNotification);

    return savedNotification;
  }

  public async getNotifications(userId: number, isRead?: boolean): Promise<Notification[]> {
    const where: { userId: number; isRead?: boolean } = { userId };
    
    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    return await this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' }
    });
  }

  public async getNotificationById(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  public async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  public async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  public async delete(id: number, userId: number): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }
}
