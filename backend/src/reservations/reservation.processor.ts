import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ReservationsService } from './reservation.service';

@Processor('reservation-expiry')
export class ReservationExpiryProcessor {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Process('expire-reservation')
  async handleExpiration(job: Job<{ reservationId: string }>) {
    const { reservationId } = job.data;
    await this.reservationsService.expireReservation(reservationId);
  }
}