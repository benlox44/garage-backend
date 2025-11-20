import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity('work_order_notes')
export class WorkOrderNote {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public workOrderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public author: User;

  @Column()
  public authorId: number;

  @Column({ type: 'text' })
  public content: string;

  @Column({ type: 'varchar', nullable: true })
  public imageUrl: string | null;

  @CreateDateColumn()
  public createdAt: Date;
}
