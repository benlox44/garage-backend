import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { RejectAppointmentDto } from './dto/reject-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { Appointment } from './entities/appointment.entity.js';

import { APPOINTMENT_STATUS } from '../common/constants/appointment-status.constant.js';
import { ROLE } from '../common/constants/role.constant.js';
import { SchedulesService } from '../schedules/schedules.service.js';
import { UsersService } from '../users/users.service.js';
import { VehiclesService } from '../vehicles/vehicles.service.js';

@Injectable()
export class AppointmentsService {
  public constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly schedulesService: SchedulesService,
    private readonly usersService: UsersService,
    private readonly vehiclesService: VehiclesService
  ) {}

  public async createAppointment(
    clientId: number,
    createAppointmentDto: CreateAppointmentDto
  ): Promise<Appointment> {
    const { mechanicId, vehicleId, scheduleId, hour, date, description } = createAppointmentDto;

    // Validate that mechanicId is actually a mechanic
    const mechanic = await this.usersService.findByIdOrThrow(mechanicId);
    if (mechanic.role !== ROLE.MECHANIC) {
      throw new BadRequestException('The selected user is not a mechanic');
    }

    const vehicle = await this.vehiclesService.findOne(vehicleId);
    if (vehicle.clientId !== clientId) {
      throw new ForbiddenException('You cannot schedule appointments for vehicles that do not belong to you');
    }

    const schedule = await this.schedulesService.getScheduleById(scheduleId);
    if (!schedule.availableHours.includes(hour)) {
      throw new BadRequestException('The selected hour is not available');
    }

    const appointment = this.appointmentRepository.create({
      clientId,
      mechanicId,
      vehicleId,
      scheduleId,
      hour,
      date,
      description,
      status: APPOINTMENT_STATUS.PENDING
    });

    const savedAppointment = await this.appointmentRepository.save(appointment);

    await this.schedulesService.removeHourFromSchedule(scheduleId, hour);

    return savedAppointment;
  }

  public async getAppointmentsByClient(clientId: number): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { clientId },
      relations: ['mechanic', 'vehicle'],
      order: { date: 'ASC', hour: 'ASC' }
    });
  }

  public async getAppointmentsByMechanic(mechanicId: number): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: { mechanicId },
      relations: ['client', 'vehicle'],
      order: { date: 'ASC', hour: 'ASC' }
    });
  }

  public async updateAppointmentStatus(
    appointmentId: number,
    mechanicId: number,
    updateAppointmentDto: UpdateAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only the assigned mechanic can update the appointment
    if (appointment.mechanicId !== mechanicId) {
      throw new ForbiddenException('You cannot modify appointments that have not been assigned to you');
    }

    // Only pending appointments can be updated
    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Only pending appointments can be modified');
    }

    const { status, rejectionReason } = updateAppointmentDto;

    // Additional validation: if rejecting, must provide rejection reason
    if (status === APPOINTMENT_STATUS.REJECTED && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required when rejecting an appointment');
    }

    if (status) {
      appointment.status = status;
    }

    if (rejectionReason) {
      appointment.rejectionReason = rejectionReason;
    }

    return await this.appointmentRepository.save(appointment);
  }

  public async acceptAppointment(appointmentId: number, mechanicId: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only the assigned mechanic can accept the appointment
    if (appointment.mechanicId !== mechanicId) {
      throw new ForbiddenException('You cannot modify appointments that have not been assigned to you');
    }

    // Only pending appointments can be accepted
    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Only pending appointments can be accepted');
    }

    appointment.status = APPOINTMENT_STATUS.ACCEPTED;
    return await this.appointmentRepository.save(appointment);
  }

  public async rejectAppointment(
    appointmentId: number, 
    mechanicId: number, 
    rejectAppointmentDto: RejectAppointmentDto
  ): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only the assigned mechanic can reject the appointment
    if (appointment.mechanicId !== mechanicId) {
      throw new ForbiddenException('You cannot modify appointments that have not been assigned to you');
    }

    // Only pending appointments can be rejected
    if (appointment.status !== APPOINTMENT_STATUS.PENDING) {
      throw new BadRequestException('Only pending appointments can be rejected');
    }

    appointment.status = APPOINTMENT_STATUS.REJECTED;
    appointment.rejectionReason = rejectAppointmentDto.rejectionReason;
    
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Add the hour back to the schedule since the appointment was rejected
    await this.schedulesService.addHourToSchedule(appointment.scheduleId, appointment.hour);
    
    return savedAppointment;
  }

  public async getAppointmentById(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['client', 'mechanic', 'vehicle', 'schedule']
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  public async deleteAppointment(id: number, userId: number): Promise<void> {
    const appointment = await this.getAppointmentById(id);

    // Only the client can cancel their own appointment and only if it's pending
    if (appointment.clientId !== userId) {
      throw new ForbiddenException('You cannot cancel appointments that do not belong to you');
    }

    if (appointment.status !== APPOINTMENT_STATUS.PENDING && appointment.status !== APPOINTMENT_STATUS.ACCEPTED) {
      throw new BadRequestException('Only pending or accepted appointments can be cancelled');
    }

    // Delete the appointment
    await this.appointmentRepository.delete(id);

    // Add the hour back to the schedule
    await this.schedulesService.addHourToSchedule(appointment.scheduleId, appointment.hour);
  }
}
