import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateMechanicScheduleDto } from './dto/create-mechanic-schedule.dto.js';
import { UpdateMechanicScheduleDto } from './dto/update-mechanic-schedule.dto.js';
import { MechanicSchedule } from './entities/mechanic-schedule.entity.js';
import { SchedulesService } from './schedules.service.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { ROLE } from '../common/constants/role.constant.js';
import { SafeSchedule, toSafeSchedule } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('schedules')
@UseGuards(AuthGuard('jwt'))
export class SchedulesController {
  public constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async createSchedule(
    @Request() req: AuthRequest,
    @Body() createScheduleDto: CreateMechanicScheduleDto
  ): Promise<{ message: string }> {
    await this.schedulesService.createSchedule(req.user.sub, createScheduleDto);
    return { 
      message: 'Schedule created successfully'
    };
  }

  @Get('available')
  public async getAvailableSchedules(): Promise<{ data: SafeSchedule[] }> {
    const schedules = await this.schedulesService.getAvailableSchedules();
    const data = schedules.map(schedule => toSafeSchedule(schedule));
    return { data };
  }

  @Get('my')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async getMySchedules(@Request() req: AuthRequest): Promise<{ data: MechanicSchedule[] }> {
    const data = await this.schedulesService.getSchedulesByMechanic(req.user.sub);
    return { data };
  }

  @Get(':id')
  public async getScheduleById(@Param('id') id: number): Promise<{ data: SafeSchedule }> {
    const schedule = await this.schedulesService.getScheduleById(id);
    const data = toSafeSchedule(schedule);
    return { data };
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async updateSchedule(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() updateScheduleDto: UpdateMechanicScheduleDto
  ): Promise<{ message: string }> {
    await this.schedulesService.updateSchedule(id, req.user.sub, updateScheduleDto.availableHours);
    return { message: 'Schedule updated successfully' };
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async deleteSchedule(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<{ message: string }> {
    await this.schedulesService.deleteSchedule(id, req.user.sub);
    return { message: 'Schedule deleted successfully' };
  }
}
