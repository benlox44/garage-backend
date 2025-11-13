import { Notification } from '../entities/notification.entity.js';

export type SafeNotification = Omit<Notification, 'user'>;
