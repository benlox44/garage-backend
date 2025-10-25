import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '../../users/entities/user.entity.js';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  public id: number;

  @CreateDateColumn()
  public createdAt: Date;

  @Column({ unique: true })
  public licensePlate: string;

  @Column()
  public brand: string;

  @Column()
  public model: string;

  @Column({ type: 'int' })
  public year: number;

  @Column()
  public color: string;

  @Column()
  public clientId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  public client: User;
}
