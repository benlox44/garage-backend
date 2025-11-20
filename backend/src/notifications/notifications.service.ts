import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification } from './entities/notification.entity.js';

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
    private readonly notificationRepository: Repository<Notification>
  ) {}

  public async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.message,
      metadata: dto.metadata ?? null
    });

    return await this.notificationRepository.save(notification);
  }

  public async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  public async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' }
    });
  }

  public async markAsRead(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });

    if (notification) {
      notification.isRead = true;
      await this.notificationRepository.save(notification);
    }
  }

  public async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }
}
