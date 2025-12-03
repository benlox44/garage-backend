import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { type NotificationType } from '../../common/constants/notification-type.constant.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public user: User;

  @Column()
  public userId: number;

  @Column()
  public type: NotificationType;

  @Column()
  public title: string;

  @Column({ type: 'text' })
  public message: string;

  @Column({ type: 'jsonb', nullable: true })
  public metadata: Record<string, unknown> | null;

  @Column({ default: false })
  public isRead: boolean;

  @CreateDateColumn()
  public createdAt: Date;
}
