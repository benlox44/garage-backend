import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UpdateUserDto } from './dto/update-user-dto.js';
import { UpdateUserEmailDto } from './dto/update-user-email.dto.js';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UsersService } from './users.service.js';

import { CreateUserDto } from '../auth/dto/create-user.dto.js';
import { ApiResponse, SafeUser } from '../common/index.js';
import { RoleGuard, Roles } from '../guards/role.guard.js';
import { CurrentUser } from '../jwt/decorators/current-user.decorator.js';
import { JwtPayload } from '../jwt/types/jwt-payload.type.js';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  // ===== CURRENT USER ENDPOINTS (/me) =====

  @Get('me')
  public async getCurrentUser(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<SafeUser>> {
    const data = await this.usersService.findMe(user.sub);
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data,
    };
  }

  @Patch('me')
  public async updateCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserDto,
  ): Promise<ApiResponse<SafeUser>> {
    const data = await this.usersService.updateProfile(user.sub, dto);
    return {
      success: true,
      message: 'Profile updated successfully',
      data,
    };
  }

  @Patch('me/password')
  public async updateCurrentUserPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserPasswordDto,
  ): Promise<ApiResponse<null>> {
    await this.usersService.updatePassword(user.sub, dto);
    return {
      success: true,
      message: 'Password updated successfully',
      data: null,
    };
  }

  @Patch('me/email')
  public async requestCurrentUserEmailUpdate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserEmailDto,
  ): Promise<ApiResponse<null>> {
    await this.usersService.requestEmailUpdate(user.sub, dto);
    return {
      success: true,
      message: 'Confirmation email sent successfully',
      data: null,
    };
  }

  @Delete('me')
  public async deleteCurrentUser(
    @CurrentUser() user: JwtPayload,
  ): Promise<ApiResponse<null>> {
    await this.usersService.delete(user.sub);
    return {
      success: true,
      message: 'Your account was deleted successfully',
      data: null,
    };
  }

  // ===== ADMIN CRUD ENDPOINTS =====

  @Get()
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  public async listUsers(
    @Query('role') role: string | undefined,
  ): Promise<ApiResponse<SafeUser[]>> {
    const data = await this.usersService.findAll(role);
    return {
      success: true,
      message: 'Users retrieved successfully',
      data,
    };
  }

  @Get(':id')
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  public async getUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<SafeUser>> {
    const data = await this.usersService.findByIdSafe(id);
    return {
      success: true,
      message: 'User retrieved successfully',
      data,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  public async createUser(
    @Body() dto: CreateUserDto,
  ): Promise<ApiResponse<null>> {
    await this.usersService.createMechanic(dto);
    return {
      success: true,
      message: 'Mechanic created successfully. Confirmation email sent to ' + dto.email,
      data: null,
    };
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  public async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<ApiResponse<SafeUser>> {
    const data = await this.usersService.updateUserRole(id, dto.role);
    return {
      success: true,
      message: 'User role updated successfully',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles('ADMIN')
  public async deleteUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ApiResponse<null>> {
    await this.usersService.delete(id);
    return {
      success: true,
      message: 'User deleted successfully',
      data: null,
    };
  }
}
