import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';


import { UpdateUserDto } from './dto/update-user-dto.js';
import { UpdateUserEmailDto } from './dto/update-user-email.dto.js';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UsersService } from './users.service.js';

import { CreateUserDto } from '../auth/dto/create-user.dto.js';
import { SafeUser } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';
import { CurrentUser } from '../jwt/decorators/current-user.decorator.js';
import { JwtPayload } from '../jwt/types/jwt-payload.type.js';

@Controller('users')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  // ===== USER ACTIONS (ME) =====

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  public async findProfile(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ data: SafeUser }> {
    const data = await this.usersService.findMe(user.sub);
    return { data };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  public async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ): Promise<{ message: string }> {
    await this.usersService.updateProfile(user.sub, dto);
    return { message: 'Profile updated successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/password')
  public async updatePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserPasswordDto,
  ): Promise<{ message: string }> {
    await this.usersService.updatePassword(user.sub, dto);
    return { message: 'Password updated successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me/email')
  public async requestUpdateEmail(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserEmailDto,
  ): Promise<{ message: string }> {
    await this.usersService.requestEmailUpdate(user.sub, dto);
    return { message: 'Confirmation email sent successfully' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  public async deleteMe(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ message: string }> {
    await this.usersService.delete(user.sub);
    return { message: 'Your account was deleted successfully' };
  }

  // ===== ADMIN ACTIONS =====

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('ADMIN')
  @Post('create-mechanic')
  public async createMechanic(
    @Body() dto: CreateUserDto,
  ): Promise<{ message: string }> {
    await this.usersService.createMechanic(dto);
    return { 
      message: 'Mechanic created successfully. Confirmation email sent to ' + dto.email
    };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('ADMIN')
  @Get()
  public async findAll(): Promise<{ data: SafeUser[] }> {
    const data = await this.usersService.findAll();
    return { data };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('ADMIN')
  @Patch(':id/role')
  public async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<{ message: string }> {
    await this.usersService.updateUserRole(id, dto.role);
    return { message: 'User role updated successfully' };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('ADMIN')
  @Delete(':id')
  public async deleteById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.usersService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
