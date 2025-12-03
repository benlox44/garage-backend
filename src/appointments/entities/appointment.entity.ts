import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

import { type AppointmentStatus } from '../../common/constants/appointment-status.constant.js';
import { MechanicSchedule } from '../../schedules/entities/mechanic-schedule.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Vehicle } from '../../vehicles/entities/vehicle.entity.js';

@Entity('appointments')
export class Appointment {
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

  @ManyToOne(() => MechanicSchedule, { onDelete: 'CASCADE' })
  public schedule: MechanicSchedule;

  @Column()
  public scheduleId: number;

  @Column({ type: 'date' })
  public date: string;

  @Column({ type: 'time' })
  public hour: string;

  @Column({ default: 'pending' })
  public status: AppointmentStatus;

  @Column({ nullable: true })
  public description?: string;

  @Column({ nullable: true })
  public rejectionReason?: string;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
