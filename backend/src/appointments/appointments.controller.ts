import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { RejectAppointmentDto } from './dto/reject-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

import { type AuthRequest } from '../auth/interfaces/auth-request.interface.js';
import { ROLE } from '../common/constants/role.constant.js';
import { SafeAppointmentForClient, SafeAppointmentForMechanic, SafeAppointmentWithSimpleClient, toSafeAppointmentForClient, toSafeAppointmentForMechanic, toSafeAppointmentWithSimpleClient } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';

@Controller('appointments')
@UseGuards(AuthGuard('jwt'))
export class AppointmentsController {
  public constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async createAppointment(
    @Request() req: AuthRequest,
    @Body() createAppointmentDto: CreateAppointmentDto
  ): Promise<{ message: string }> {
    await this.appointmentsService.createAppointment(req.user.sub, createAppointmentDto);
    return { 
      message: 'Appointment scheduled successfully'
    };
  }

  @Get('client')
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async getMyAppointments(@Request() req: AuthRequest): Promise<{ data: SafeAppointmentForClient[] }> {
    const appointments = await this.appointmentsService.getAppointmentsByClient(req.user.sub);
    const data = appointments.map(appointment => toSafeAppointmentForClient(appointment));
    return { data };
  }

  @Get('mechanic')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async getMechanicAppointments(@Request() req: AuthRequest): Promise<{ data: SafeAppointmentForMechanic[] }> {
    const appointments = await this.appointmentsService.getAppointmentsByMechanic(req.user.sub);
    const data = appointments.map(appointment => toSafeAppointmentForMechanic(appointment));
    return { data };
  }

  @Get(':id')
  public async getAppointmentById(@Param('id') id: number): Promise<{ data: SafeAppointmentWithSimpleClient }> {
    const appointment = await this.appointmentsService.getAppointmentById(id);
    const data = toSafeAppointmentWithSimpleClient(appointment);
    return { data };
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async updateAppointmentStatus(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() updateAppointmentDto: UpdateAppointmentDto
  ): Promise<{ message: string }> {
    await this.appointmentsService.updateAppointmentStatus(
      id,
      req.user.sub,
      updateAppointmentDto
    );
    return { 
      message: 'Appointment updated successfully'
    };
  }

  @Patch(':id/accept')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async acceptAppointment(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<{ message: string }> {
    await this.appointmentsService.acceptAppointment(id, req.user.sub);
    return { 
      message: 'Appointment accepted successfully'
    };
  }

  @Patch(':id/reject')
  @UseGuards(RoleGuard)
  @Roles(ROLE.MECHANIC)
  public async rejectAppointment(
    @Param('id') id: number,
    @Request() req: AuthRequest,
    @Body() rejectAppointmentDto: RejectAppointmentDto
  ): Promise<{ message: string }> {
    await this.appointmentsService.rejectAppointment(id, req.user.sub, rejectAppointmentDto);
    return { 
      message: 'Appointment rejected successfully'
    };
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(ROLE.CLIENT)
  public async deleteAppointment(
    @Param('id') id: number,
    @Request() req: AuthRequest
  ): Promise<{ message: string }> {
    await this.appointmentsService.deleteAppointment(id, req.user.sub);
    return { message: 'Appointment cancelled successfully' };
  }
}
