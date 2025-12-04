import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Product } from '../entities/product.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
    @InjectQueue('reservation-expiry')
    private expirationQueue: Queue,
  ) {}

  async createReservation(createReservationDto: CreateReservationDto) {
    const { productId, quantity } = createReservationDto;
    
    // Use transaction to ensure atomicity
    return await this.dataSource.transaction(async (manager) => {
      // Lock the product row for update
      const product = await manager.findOne(Product, {
        where: { id: productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Check if enough stock is available
      if (product.availableStock < quantity) {
        throw new ConflictException('Insufficient stock available');
      }

      // Calculate expiration time (2 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 2);

      // Create reservation
      const reservation = manager.create(Reservation, {
        productId,
        quantity,
        expiresAt,
        status: ReservationStatus.ACTIVE,
      });

      // Update product stock
      product.availableStock -= quantity;
      product.reservedStock += quantity;

      await manager.save(product);
      const savedReservation = await manager.save(reservation);

      // Add job to expiration queue
      await this.expirationQueue.add(
        'expire-reservation',
        { reservationId: savedReservation.id },
        { delay: 2 * 60 * 1000 }, // 2 minutes delay
      );

      return savedReservation;
    });
  }

  async completeReservation(id: string) {
    return await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(Reservation, {
        where: { id },
        relations: ['product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new ConflictException('Reservation is not active');
      }

      // Check if reservation has expired
      if (new Date() > reservation.expiresAt) {
        reservation.status = ReservationStatus.EXPIRED;
        await manager.save(reservation);
        throw new ConflictException('Reservation has expired');
      }

      // Update reservation status
      reservation.status = ReservationStatus.COMPLETED;
      reservation.completedAt = new Date();

      // Update product stock
      const product = reservation.product;
      product.reservedStock -= reservation.quantity;
      // Available stock remains reduced (purchased)

      await manager.save(product);
      return await manager.save(reservation);
    });
  }

  async getActiveReservations() {
    return this.reservationRepository.find({
      where: { status: ReservationStatus.ACTIVE },
      relations: ['product'],
    });
  }

  async expireReservation(reservationId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const reservation = await manager.findOne(Reservation, {
        where: { id: reservationId },
        relations: ['product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation || reservation.status !== ReservationStatus.ACTIVE) {
        return;
      }

      // Only expire if still active and past expiration
      if (new Date() <= reservation.expiresAt) {
        return;
      }

      reservation.status = ReservationStatus.EXPIRED;

      // Restore product stock
      const product = reservation.product;
      product.availableStock += reservation.quantity;
      product.reservedStock -= reservation.quantity;

      await manager.save(product);
      await manager.save(reservation);
    });
  }

  async findAll() {
    return this.reservationRepository.find({ relations: ['product'] });
  }

  async findOne(id: string) {
    return this.reservationRepository.findOne({
      where: { id },
      relations: ['product'],
    });
  }
}