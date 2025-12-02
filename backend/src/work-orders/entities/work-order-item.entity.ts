import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { WorkOrder } from './work-order.entity.js';

@Entity('work_order_items')
export class WorkOrderItem {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => WorkOrder, workOrder => workOrder.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workOrderId' })
  public workOrder: any;

  @Column()
  public workOrderId: number;

  @Column()
  public name: string;

  @Column({ nullable: true })
  public inventoryItemId: number;

  @Column()
  public type: 'spare_part' | 'tool' | 'service';

  @Column({ type: 'int', default: 1 })
  public quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  public unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  public totalPrice: number;

  @Column({ default: false })
  public requiresApproval: boolean;

  @Column({ default: false })
  public isApproved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  public approvedAt: Date | null;

  @CreateDateColumn()
  public createdAt: Date;
}
