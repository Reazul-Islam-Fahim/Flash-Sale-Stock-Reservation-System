import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReservationsService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto) {
    return this.reservationsService.createReservation(createReservationDto);
  }

  @Post(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.completeReservation(id);
  }

  @Get()
  findAll() {
    return this.reservationsService.findAll();
  }

  @Get('active')
  findActive() {
    return this.reservationsService.getActiveReservations();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.findOne(id);
  }
}