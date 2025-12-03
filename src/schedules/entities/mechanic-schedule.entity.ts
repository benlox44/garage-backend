import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  ManyToOne, 
  PrimaryGeneratedColumn,
  UpdateDateColumn 
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity('mechanic_schedules')
export class MechanicSchedule {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public mechanic: User;

  @Column()
  public mechanicId: number;

  @Column({ type: 'date' })
  public date: string;

  @Column('simple-array')
  public availableHours: string[];

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
