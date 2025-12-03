import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public sku: string;

  @Column()
  public name: string;

  @Column({ nullable: true })
  public description: string;

  @Column({ type: 'int', default: 0 })
  public quantity: number;

  @Column({ type: 'int', default: 5 })
  public minStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  public price: number;

  @CreateDateColumn()
  public createdAt: Date;

  @UpdateDateColumn()
  public updatedAt: Date;
}
