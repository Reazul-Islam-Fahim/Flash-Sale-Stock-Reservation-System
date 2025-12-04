import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ReservationsService } from './reservation.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from '../entities/reservation.entity';
import { Product } from '../entities/product.entity';
import { ReservationExpiryProcessor } from './reservation.processor';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Product]),
    BullModule.registerQueue({
      name: 'reservation-expiry',
    }),
    ProductsModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationExpiryProcessor],
  exports: [ReservationsService],
})
export class ReservationsModule {}