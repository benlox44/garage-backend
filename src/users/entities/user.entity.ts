import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Appointment } from '../../appointments/entities/appointment.entity.js';
import { ROLE, type Role } from '../../common/constants/role.constant.js';
import { MechanicSchedule } from '../../schedules/entities/mechanic-schedule.entity.js';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public createdAt: Date;

  @Column({ type: 'varchar', default: ROLE.CLIENT })
  public role: Role;

  @Column({ default: false })
  public isLocked: boolean;

  @Column()
  public name: string;

  @Column()
  public password: string;

  @Column({ unique: true })
  public email: string;

  @Column({ default: false })
  public isEmailConfirmed: boolean;

  @Column({ type: 'varchar', nullable: true })
  public oldEmail: string | null;

  @Column({ type: 'varchar', nullable: true })
  public newEmail: string | null;

  @Column({ type: 'timestamp', nullable: true })
  public emailChangedAt: Date | null;

  @OneToMany(() => MechanicSchedule, (schedule: MechanicSchedule) => schedule.mechanic)
  public schedules: MechanicSchedule[];

  @OneToMany(() => Appointment, (appointment: Appointment) => appointment.client)
  public appointments: Appointment[];

  @OneToMany(() => Appointment, (appointment: Appointment) => appointment.mechanic)
  public mechanicAppointments: Appointment[];
}
