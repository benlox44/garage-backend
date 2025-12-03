import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, Query, HttpCode, HttpStatus, ParseBoolPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CreateMechanicScheduleDto } from './dto/create-mechanic-schedule.dto.js';
import { UpdateMechanicScheduleDto } from './dto/update-mechanic-schedule.dto.js';
import { MechanicSchedule } from './entities/mechanic-schedule.entity.js';
import { SchedulesService } from './schedules.service.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { ROLE } from '../common/constants/role.constant.js';
import { ApiResponse, SafeSchedule, toSafeSchedule } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('schedules')
@UseGuards(AuthGuard('jwt'))
export class SchedulesController {
  public constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  public async listSchedules(
    @Request() req: AuthRequest,
    @Query('available', new ParseBoolPipe({ optional: true })) available: boolean | undefined,
    @Query('mechanicId') mechanicId: number | undefined,
    @Query('date') date: string | undefined,
  ): Promise<ApiResponse<SafeSchedule[]>> {
    const schedules = await this.schedulesService.findAll(
      req.user.sub,
      req.user.role,
      available,
      mechanicId,
      date,
    );
    const data = schedules.map(schedule => toSafeSchedule(schedule));
    return {
      success: true,
      message: 'Schedules retrieved successfully',
      data,
    };
  }

  @Get(':id')
  public async getSchedule(@Param('id') id: number): Promise<ApiResponse<SafeSchedule>> {
    const schedule = await this.schedulesService.getScheduleById(id);
    const data = toSafeSchedule(schedule);
    return {
      success: true,
      message: 'Schedule retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async createSchedule(
    @Request() req: AuthRequest,
    @Body() createScheduleDto: CreateMechanicScheduleDto
  ): Promise<ApiResponse<MechanicSchedule>> {
    const data = await this.schedulesService.createSchedule(req.user.sub, createScheduleDto);
    return {
      success: true,
      message: 'Schedule created successfully',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async updateSchedule(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() updateScheduleDto: UpdateMechanicScheduleDto
  ): Promise<ApiResponse<MechanicSchedule>> {
    const data = await this.schedulesService.updateSchedule(id, req.user.sub, updateScheduleDto.availableHours);
    return {
      success: true,
      message: 'Schedule updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async deleteSchedule(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<ApiResponse<null>> {
    await this.schedulesService.deleteSchedule(id, req.user.sub);
    return {
      success: true,
      message: 'Schedule deleted successfully',
      data: null,
    };
  }
}
