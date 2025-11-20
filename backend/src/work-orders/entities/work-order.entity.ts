import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { WorkOrderItem } from './work-order-item.entity.js';
import { WorkOrderNote } from './work-order-note.entity.js';

import { type WorkOrderStatus } from '../../common/constants/work-order-status.constant.js';
import { User } from '../../users/entities/user.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public client: User;

  @Column()
  public clientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public mechanic: User;

  @Column()
  public mechanicId: number;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  public vehicle: Vehicle;

  @Column()
  public vehicleId: number;

  @Column({ default: 'pending_approval' })
  public status: WorkOrderStatus;

  @Column({ type: 'text' })
  public description: string;

  @Column('simple-array')
  public requestedServices: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  public estimatedCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  public finalCost: number | null;

  @OneToMany(() => WorkOrderItem, 'workOrderId', { cascade: true })
  public items: WorkOrderItem[];

  @OneToMany(() => WorkOrderNote, 'workOrderId', { cascade: true })
  public notes: WorkOrderNote[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
