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
  ) { }

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
    console.log(`🔄 Completing reservation: ${id}`);

    return await this.dataSource.transaction(async (manager) => {
      // Get reservation WITHOUT relations to avoid outer join with FOR UPDATE
      const reservation = await manager.findOne(Reservation, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
        // ⚠️ REMOVE relations: ['product'] here
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

      // Get product separately with lock
      const product = await manager.findOne(Product, {
        where: { id: reservation.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Update reservation status
      reservation.status = ReservationStatus.COMPLETED;
      reservation.completedAt = new Date();

      // Update product stock
      product.reservedStock -= reservation.quantity;
      // Available stock remains reduced (purchased)

      console.log(`📊 Updating stock:`, {
        productId: product.id,
        reservedStock: `from ${product.reservedStock + reservation.quantity} to ${product.reservedStock}`,
        availableStock: product.availableStock
      });

      await manager.save(product);
      const savedReservation = await manager.save(reservation);

      console.log(`✅ Reservation completed: ${savedReservation.id}`);

      // Return with populated product data
      return {
        ...savedReservation,
        product // Manually attach product to response
      };
    });
  }

  async getActiveReservations() {
    return this.reservationRepository.find({
      where: { status: ReservationStatus.ACTIVE },
      relations: ['product'],
    });
  }

  async expireReservation(reservationId: string) {
    console.log(`⏰ [expireReservation] Starting expiration for: ${reservationId}`);

    return await this.dataSource.transaction(async (manager) => {
      // Get reservation WITHOUT relations to avoid outer join with FOR UPDATE
      const reservation = await manager.findOne(Reservation, {
        where: { id: reservationId },
        // ⚠️ REMOVE relations: ['product'] from here
        lock: { mode: 'pessimistic_write' },
      });

      if (!reservation) {
        console.log(`❌ [expireReservation] Reservation not found: ${reservationId}`);
        return;
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        console.log(`⚠️ [expireReservation] Reservation ${reservationId} is not active (status: ${reservation.status})`);
        return;
      }

      // Check if reservation has actually expired
      const now = new Date();
      if (now <= reservation.expiresAt) {
        console.log(`⏳ [expireReservation] Reservation ${reservationId} not expired yet (expires at: ${reservation.expiresAt})`);
        return;
      }

      console.log(`🔄 [expireReservation] Expiring reservation ${reservationId}...`);

      // Get product separately with lock
      const product = await manager.findOne(Product, {
        where: { id: reservation.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        console.log(`❌ [expireReservation] Product not found for reservation ${reservationId}`);
        return;
      }

      console.log(`📦 [expireReservation] Before restoration:`, {
        productId: product.id,
        availableStock: product.availableStock,
        reservedStock: product.reservedStock,
        reservationQuantity: reservation.quantity
      });

      // Update reservation status
      reservation.status = ReservationStatus.EXPIRED;

      // Restore product stock
      product.availableStock += reservation.quantity;
      product.reservedStock -= reservation.quantity;

      console.log(`📦 [expireReservation] After restoration:`, {
        availableStock: product.availableStock,
        reservedStock: product.reservedStock
      });

      await manager.save(product);
      await manager.save(reservation);

      console.log(`✅ [expireReservation] Successfully expired reservation ${reservationId} and restored stock`);

      return reservation;
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