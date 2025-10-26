import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { CreateMechanicScheduleDto } from './dto/create-mechanic-schedule.dto.js';
import { MechanicSchedule } from './entities/mechanic-schedule.entity.js';

import { Appointment } from '../appointments/entities/appointment.entity.js';
import { APPOINTMENT_STATUS } from '../common/constants/appointment-status.constant.js';
import { APPOINTMENT_DURATION } from '../common/index.js';

@Injectable()
export class SchedulesService {
  public constructor(
    @InjectRepository(MechanicSchedule)
    private readonly scheduleRepository: Repository<MechanicSchedule>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>
  ) {}

  public async createSchedule(
    mechanicId: number,
    createScheduleDto: CreateMechanicScheduleDto
  ): Promise<MechanicSchedule> {
    const { date, availableHours } = createScheduleDto;

    // Check if schedule already exists for this date
    const existingSchedule = await this.scheduleRepository.findOne({
      where: { mechanicId, date }
    });

    if (existingSchedule) {
      throw new BadRequestException('Schedule already exists for this date');
    }

    // Check if any of the available hours conflict with existing appointments
    const existingAppointments = await this.appointmentRepository.find({
      where: {
        mechanicId,
        date,
        status: In([APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED])
      }
    });

    const conflictingHours = availableHours.filter(newHour => {
      return existingAppointments.some(appointment => {
        // Normalize hour format for comparison
        const appointmentHour = appointment.hour.length > 5 ? appointment.hour.substring(0, 5) : appointment.hour;
        
        // Convert hours to minutes for easier comparison
        const [newH, newM] = newHour.split(':').map(Number);
        const [appH, appM] = appointmentHour.split(':').map(Number);
        
        const newHourInMinutes = newH * 60 + newM;
        const appointmentInMinutes = appH * 60 + appM;
        
        // Check if the new hour is within 1 hour (60 minutes) of an existing appointment
        const timeDifference = Math.abs(newHourInMinutes - appointmentInMinutes);
        return timeDifference < APPOINTMENT_DURATION.MIN_HOURS_BETWEEN_APPOINTMENTS; // Less than 60 minutes apart
      });
    });

    if (conflictingHours.length > 0) {
      throw new BadRequestException(
        `Cannot add hours ${conflictingHours.join(', ')} as they are within 1 hour of existing pending or accepted appointments`
      );
    }

    const schedule = this.scheduleRepository.create({
      mechanicId,
      date,
      availableHours
    });

    return await this.scheduleRepository.save(schedule);
  }

  public async getSchedulesByMechanic(mechanicId: number): Promise<MechanicSchedule[]> {
    return await this.scheduleRepository.find({
      where: { mechanicId },
      order: { date: 'ASC' }
    });
  }

  public async getScheduleById(id: number): Promise<MechanicSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['mechanic'],
      select: {
        id: true,
        mechanicId: true,
        date: true,
        availableHours: true,
        createdAt: true,
        updatedAt: true,
        mechanic: {
          name: true
        }
      }
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  public async getAvailableSchedules(): Promise<MechanicSchedule[]> {
    const today = new Date().toISOString().split('T')[0];
    
    return await this.scheduleRepository
      .createQueryBuilder('schedule')
      .leftJoin('schedule.mechanic', 'mechanic')
      .addSelect(['mechanic.id', 'mechanic.name'])
      .where('schedule.date >= :today', { today })
      .andWhere('schedule.availableHours IS NOT NULL')
      .andWhere('schedule.availableHours != :emptyArray', { emptyArray: '[]' })
      .orderBy('schedule.date', 'ASC')
      .getMany();
  }

  public async removeHourFromSchedule(scheduleId: number, hour: string): Promise<void> {
    const schedule = await this.getScheduleById(scheduleId);
    
    const normalizedHour = hour.length > 5 ? hour.substring(0, 5) : hour;
    
    const updatedHours = schedule.availableHours.filter((h: string) => h !== normalizedHour);
    
    schedule.availableHours = updatedHours;
    await this.scheduleRepository.save(schedule);
  }

  public async addHourToSchedule(scheduleId: number, hour: string): Promise<void> {
    const schedule = await this.getScheduleById(scheduleId);
    
    // Normalize hour format: remove seconds if present (e.g., "09:00:00" -> "09:00")
    const normalizedHour = hour.length > 5 ? hour.substring(0, 5) : hour;
    
    // Check if hour is not already in the available hours
    if (!schedule.availableHours.includes(normalizedHour)) {
      schedule.availableHours.push(normalizedHour);
      // Sort hours to maintain order
      schedule.availableHours.sort();
      await this.scheduleRepository.save(schedule);
    }
  }

  public async updateSchedule(
    id: number, 
    mechanicId: number, 
    availableHours: string[]
  ): Promise<MechanicSchedule> {
    const schedule = await this.getScheduleById(id);
    
    // Verify that the schedule belongs to the mechanic
    if (schedule.mechanicId !== mechanicId) {
      throw new BadRequestException('You cannot update schedules that do not belong to you');
    }

    // Check if any of the new available hours conflict with existing appointments
    const existingAppointments = await this.appointmentRepository.find({
      where: {
        mechanicId,
        date: schedule.date,
        status: In([APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.ACCEPTED])
      }
    });

    const conflictingHours = availableHours.filter(newHour => {
      return existingAppointments.some(appointment => {
        // Normalize hour format for comparison
        const appointmentHour = appointment.hour.length > 5 ? appointment.hour.substring(0, 5) : appointment.hour;
        
        // Convert hours to minutes for easier comparison
        const [newH, newM] = newHour.split(':').map(Number);
        const [appH, appM] = appointmentHour.split(':').map(Number);
        
        const newHourInMinutes = newH * 60 + newM;
        const appointmentInMinutes = appH * 60 + appM;
        
        // Check if the new hour is within 1 hour (60 minutes) of an existing appointment
        const timeDifference = Math.abs(newHourInMinutes - appointmentInMinutes);
        return timeDifference < APPOINTMENT_DURATION.MIN_HOURS_BETWEEN_APPOINTMENTS; // Less than 60 minutes apart
      });
    });

    if (conflictingHours.length > 0) {
      throw new BadRequestException(
        `Cannot add hours ${conflictingHours.join(', ')} as they are within 1 hour of existing pending or accepted appointments`
      );
    }

    // Check if the schedule date is in the past
    const scheduleDate = new Date(schedule.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);
    
    if (scheduleDate < today) {
      throw new BadRequestException('Cannot update schedules for past dates');
    }

    // If the schedule is for today, check if hours are in the future
    if (scheduleDate.toDateString() === new Date().toDateString()) {
      const currentHour = new Date().getHours();
      const currentMinute = new Date().getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      for (const hour of availableHours) {
        const [h, m] = hour.split(':').map(Number);
        const hourInMinutes = h * 60 + m;
        
        if (hourInMinutes <= currentTimeInMinutes) {
          throw new BadRequestException('Cannot set hours that have already passed today');
        }
      }
    }

    // Check if the new available hours are the same as current ones
    const currentHours = [...schedule.availableHours].sort();
    const newHours = [...availableHours].sort();
    
    if (JSON.stringify(currentHours) === JSON.stringify(newHours)) {
      throw new BadRequestException('New available hours must be different from the current ones');
    }

    schedule.availableHours = availableHours;
    return await this.scheduleRepository.save(schedule);
  }

  public async deleteSchedule(id: number, mechanicId: number): Promise<void> {
    const schedule = await this.getScheduleById(id);
    
    // Verify that the schedule belongs to the mechanic
    if (schedule.mechanicId !== mechanicId) {
      throw new BadRequestException('You cannot delete schedules that do not belong to you');
    }

    const result = await this.scheduleRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException('Schedule not found');
    }
  }
}
