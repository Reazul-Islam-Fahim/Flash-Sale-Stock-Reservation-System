import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Reservation } from './reservation.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  availableStock: number;

  @Column({ default: 0 })
  reservedStock: number;

  @OneToMany(() => Reservation, (reservation) => reservation.product)
  reservations: Reservation[];
}